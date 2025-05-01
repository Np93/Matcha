from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from app.utils.jwt_handler import verify_user_from_token, verify_user_from_socket_token
from app.profile.block_service import are_users_blocked
from app.routers.notifications import send_notification
from app.chat.chat_service import get_user_conversations_from_db, get_messages_from_conversation, get_conversation_users, insert_message
from jose import JWTError, jwt
import json, base64

router = APIRouter()

#  Stockage des connexions WebSocket actives
active_connections = {}
@router.get("/conversations")
async def get_user_conversations(request: Request):
    user = await verify_user_from_token(request)
    user_id = user["id"]

    raw_conversations = await get_user_conversations_from_db(user_id)

    filtered = []
    for row in raw_conversations:
        other_id = row.other_user_id
        if not await are_users_blocked(user_id, other_id):
            avatar = (
                f"data:image/jpeg;base64,{base64.b64encode(row.profile_picture).decode('utf-8')}"
                if row.profile_picture else None
            )
            filtered.append({
                "id": row.conversation_id,
                "name": row.other_username,
                "avatar": avatar,
                "isOnline": row.is_online,
            })
    return filtered

@router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: int, request: Request):
    await verify_user_from_token(request)
    rows = await get_messages_from_conversation(conversation_id)
    return [
        {
            "id": row.id,
            "sender_id": row.sender_id,
            "content": row.content,
            "timestamp": str(row.timestamp)
        }
        for row in rows
    ]

@router.post("/send")
async def send_message(request: Request, data: dict):
    user = await verify_user_from_token(request)
    sender_id = user["id"]
    conversation_id = data["chat_id"]
    content = data["content"]

    convo = await get_conversation_users(conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    receiver_id = convo.user1_id if convo.user2_id == sender_id else convo.user2_id

    message_id, timestamp = await insert_message(conversation_id, sender_id, content)

    for user_socket in active_connections.get(conversation_id, []):
        user_socket_id, ws = user_socket
        if user_socket_id in {sender_id, receiver_id}:
            await ws.send_text(json.dumps({
                "id": message_id,
                "sender_id": sender_id,
                "content": content,
                "timestamp": str(timestamp)
            }))

    if not any(user_socket_id == receiver_id for user_socket_id, _ in active_connections.get(conversation_id, [])):
        await send_notification(
            receiver_id=receiver_id,
            sender_id=sender_id,
            notification_type="message",
            context=f"{user['username']} vous a envoyé un message."
        )

    return {"message": "Message envoyé"}

@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: int):
    """ WebSocket sécurisé avec JWT en Cookie HTTPOnly """
    await websocket.accept()
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=1008)  # 1008 : Policy Violation
        return
    try:
        user = await verify_user_from_socket_token(token)
        if not user or not user["status"]:  # Vérifier si l'utilisateur est en ligne
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    active_connections.setdefault(conversation_id, []).append((user["id"], websocket))

    try:
        while True:
            await websocket.receive_text()  # Maintenir la connexion
    except WebSocketDisconnect:
        active_connections[conversation_id] = [
            conn for conn in active_connections[conversation_id] if conn[1] != websocket
        ]

@router.post("/typing")
async def typing_status(request: Request, data: dict):
    """Informe chaque utilisateur dans la conversation si l'autre est en train d'écrire."""
    user = await verify_user_from_token(request)
    sender_id = user["id"]
    conversation_id = data["chat_id"]
    is_typing = data["is_typing"]  # Boolean : True -> Tape, False -> Arrête

    # Vérifier si l’autre utilisateur est connecté via WebSocket
    if conversation_id in active_connections:
        for other_user_id, ws in active_connections[conversation_id]:
            if other_user_id != sender_id:  # Ne pas notifier l'auteur lui-même
                await ws.send_text(json.dumps({
                    "event": "typing",
                    "typing": is_typing,
                    "username": user["username"]
                }))

    return {"message": "Typing status updated"}

# @router.websocket("/ws/video/{conversation_id}")
# async def websocket_video_endpoint(websocket: WebSocket, conversation_id: int):
#     """ WebSocket pour les signaux WebRTC """
#     await websocket.accept()
    
#     if conversation_id not in active_connections:
#         active_connections[conversation_id] = []

#     active_connections[conversation_id].append(websocket)

#     try:
#         while True:
#             message = await websocket.receive_text()
#             for ws in active_connections[conversation_id]:
#                 if ws != websocket:
#                     await ws.send_text(message)
#     except WebSocketDisconnect:
#         active_connections[conversation_id].remove(websocket)

# active_call_sessions = {}

# @router.websocket("/ws/call/{receiver_id}")
# async def websocket_call(websocket: WebSocket, receiver_id: int):
#     """ WebSocket pour gérer les appels en temps réel. """
#     await websocket.accept()
#     token = websocket.cookies.get("access_token")
    
#     if not token:
#         await websocket.close(code=1008)
#         return

#     try:
#         user = await verify_user_from_socket_token(token)
#         caller_id = user["id"]
#     except:
#         await websocket.close(code=1008)
#         return

#     # Stocke la connexion pour cet utilisateur
#     active_call_sessions[caller_id] = websocket

#     # Envoi d'une notification à l'utilisateur appelé
#     if receiver_id in active_call_sessions:
#         await active_call_sessions[receiver_id].send_text(json.dumps({
#             "event": "incoming_call",
#             "caller_id": caller_id,
#             "caller_name": user["username"]
#         }))

#     try:
#         while True:
#             message = await websocket.receive_text()
#             if receiver_id in active_call_sessions:
#                 await active_call_sessions[receiver_id].send_text(message)
#     except WebSocketDisconnect:
#         active_call_sessions.pop(caller_id, None)



# active_call_sessions = {}

# @router.websocket("/ws/call/{user_id}")
# async def websocket_call(websocket: WebSocket, user_id: int):
#     """ Gère l'appel vidéo en WebRTC entre deux utilisateurs via WebSockets """
#     await websocket.accept()
#     active_call_sessions[user_id] = websocket

#     try:
#         while True:
#             message = await websocket.receive_text()
#             data = json.loads(message)

#             if data["event"] == "call_request":
#                 # Vérifie si le destinataire est connecté
#                 receiver_id = data["receiver_id"]
#                 if receiver_id in active_call_sessions:
#                     await active_call_sessions[receiver_id].send_text(json.dumps({
#                         "event": "incoming_call",
#                         "caller_id": user_id,
#                         "caller_name": data["caller_name"]
#                     }))

#             elif data["event"] == "call_response":
#                 # L'utilisateur appelé accepte ou refuse l'appel
#                 caller_id = data["caller_id"]
#                 if caller_id in active_call_sessions:
#                     await active_call_sessions[caller_id].send_text(json.dumps({
#                         "event": "call_response",
#                         "accepted": data["accepted"]
#                     }))

#             elif data["event"] in ["offer", "answer", "candidate"]:
#                 # Transmet l'ICE candidate, offer ou answer entre les utilisateurs
#                 target_id = data["target_id"]
#                 if target_id in active_call_sessions:
#                     await active_call_sessions[target_id].send_text(json.dumps(data))

#             elif data["event"] == "call_end":
#                 # L'un des utilisateurs raccroche, ferme la connexion WebSocket
#                 target_id = data["target_id"]
#                 if target_id in active_call_sessions:
#                     await active_call_sessions[target_id].send_text(json.dumps({"event": "call_end"}))
#                     await active_call_sessions[target_id].close()
#                     del active_call_sessions[target_id]

#     except WebSocketDisconnect:
#         if user_id in active_call_sessions:
#             del active_call_sessions[user_id]