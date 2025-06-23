from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect
from app.utils.jwt_handler import verify_user_from_token, verify_user_from_socket_token
from app.profile.block_service import are_users_blocked
from app.routers.notifications import send_notification
from fastapi.responses import JSONResponse
from app.chat.chat_service import (
    get_user_conversations_from_db, get_messages_from_conversation, get_conversation_users, insert_message,
    insert_date_invite, get_latest_invite, update_invite_status,
    save_user_preferences, get_preferences)
from jose import JWTError, jwt
from app.match.match_service import check_if_unliked
import json, base64

router = APIRouter()

#  Stockage des connexions WebSocket actives
active_connections = {}
@router.get("/conversations")
async def get_user_conversations(request: Request):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    user_id = user["id"]

    raw_conversations = await get_user_conversations_from_db(user_id)

    filtered = []
    for row in raw_conversations:
        other_id = row.other_user_id

        # Ne pas afficher si bloqué
        if await are_users_blocked(user_id, other_id):
            continue

        # Ne pas afficher si un des deux a unliked l'autre
        if await check_if_unliked(user_id, other_id) or await check_if_unliked(other_id, user_id):
            continue

        avatar = (
            f"data:image/jpeg;base64,{base64.b64encode(row.profile_picture).decode('utf-8')}"
            if row.profile_picture else None
        )
        filtered.append({
            "id": row.conversation_id,
            "name": row.other_username,
            "avatar": avatar,
            "isOnline": row.is_online,
            "other_user_id": other_id
        })

    return filtered

@router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: int, request: Request):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    rows = await get_messages_from_conversation(conversation_id)
    return [
        {
            "id": row.id,
            "sender_id": row.sender_id,
            "content": row.content,
            "timestamp": str(row.timestamp),
            "type": row.type
        }
        for row in rows
    ]

@router.post("/send")
async def send_message(request: Request, data: dict):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    sender_id = user["id"]
    conversation_id = data["chat_id"]
    content = data["content"]

    convo = await get_conversation_users(conversation_id)
    if not convo:
        return {"success": False, "detail": "Conversation introuvable"}

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

    return {"success": True, "message": "Message envoyé"}

@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: int):
    """ WebSocket sécurisé avec JWT en Cookie HTTPOnly """
    # await websocket.accept()
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
    await websocket.accept()
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
    if isinstance(user, JSONResponse):
        return user
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

    return {"success": True, "message": "Typing status updated"}

active_video_connections: dict[int, list[tuple[int, WebSocket]]] = {}

@router.websocket("/ws/video/{conversation_id}")
async def video_websocket(websocket: WebSocket, conversation_id: int):
    print(f"✅ Connexion WebSocket vidéo pour conversation {conversation_id}")
    # await websocket.accept()
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        user = await verify_user_from_socket_token(token)
    except JWTError:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    user_id = user["id"]
    active_video_connections.setdefault(conversation_id, []).append((user_id, websocket))
    print(f"✅ Video WebSocket ouverte pour user {user_id} dans la conversation {conversation_id}")

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            # On broadcast l'événement à l'autre utilisateur
            for uid, conn in active_video_connections[conversation_id]:
                if uid != user_id:
                    try:
                        await conn.send_text(raw)
                    except Exception as e:
                        print(f"⚠️ Impossible d’envoyer à {uid} : {e}")
    except WebSocketDisconnect:
        active_video_connections[conversation_id] = [
            conn for conn in active_video_connections[conversation_id] if conn[1] != websocket
        ]
        if not active_video_connections[conversation_id]:
            del active_video_connections[conversation_id]
        print(f"🔌 Video WebSocket fermée pour user {user_id} dans la conversation {conversation_id}")


@router.post("/date_invite")
async def send_date_invite(request: Request):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    sender_id = user["id"]
    body = await request.json()
    chat_id = body.get("chat_id")

    convo = await get_conversation_users(chat_id)
    if not convo:
        return {"success": False, "detail": "Conversation introuvable"}

    latest = await get_latest_invite(chat_id)

    if latest and latest.status == "pending":
        return {"success": False, "detail": "Une invitation est déjà en cours"}
    
    if latest and latest.status == "accepted":
        return {"ok": True}  # autoriser l'ouverture de modale

    await insert_date_invite(chat_id, sender_id)

    await insert_message(
        conversation_id=chat_id,
        sender_id=sender_id,
        content=f"{user['username']} vous invite à planifier un rendez-vous.",
        type_="date_invite"
    )

    for _, ws in active_connections.get(chat_id, []):
        await ws.send_text(json.dumps({
            "type": "date_invite",
            "sender_id": sender_id,
            "sender_name": user["username"],
            "status": "pending"
        }))

    return {"success": True, "ok": True}

@router.post("/date_invite/respond")
async def respond_to_date_invite(request: Request):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    user_id = user["id"]
    body = await request.json()
    chat_id = body.get("chat_id")
    accepted = body.get("accepted")

    invite = await get_latest_invite(chat_id)
    if not invite:
        return {"success": False, "detail": "Aucune invitation trouvée"}

    status = "accepted" if accepted else "declined"
    await update_invite_status(chat_id, status)

    print("insert message respond_to_date_invite? valeur de user_id: ", user_id)
    await insert_message(
        conversation_id=chat_id,
        sender_id=user_id,
        content="Invitation acceptée." if accepted else "Invitation refusée.",
        type_="date_invite"
    )

    for _, ws in active_connections.get(chat_id, []):
        await ws.send_text(json.dumps({
            "type": "date_invite",
            "sender_id": user_id,
            "sender_name": user["username"],
            "status": status
        }))

    return {"success": True, "ok": True}

@router.post("/date_invite/preferences")
async def submit_preferences(request: Request):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    user_id = user["id"]

    body = await request.json()
    chat_id = body.get("chat_id")
    moments = body.get("moments", [])
    activities = body.get("activities", [])

    invite = await get_latest_invite(chat_id)
    if not invite or invite["status"] != "accepted":
        return {"success": False, "detail": "Invitation non acceptée"}

    await save_user_preferences(chat_id, user_id, moments, activities)

    prefs = await get_preferences(chat_id)
    if len(prefs) < 2:
        return {"waiting": True}

    def parse_json_field(val):
        try:
            return set(json.loads(val)) if isinstance(val, str) else set(val)
        except Exception:
            return set()

    u1, u2 = prefs
    m1 = parse_json_field(u1["moments"])
    a1 = parse_json_field(u1["activities"])
    m2 = parse_json_field(u2["moments"])
    a2 = parse_json_field(u2["activities"])

    intersection_moments = m1 & m2
    intersection_activities = a1 & a2

    # Gestion de la surprise
    activity = (
        "🎁 Surprise !"
        if "Fais-moi la surprise" in a1 or "Fais-moi la surprise" in a2
        else next(iter(intersection_activities), None)
    )
    moment = next(iter(intersection_moments), None)

    message = (
        f"Proposition de rendez-vous : {moment} – {activity}"
        if activity and moment else
        "Aucun créneau commun. Veuillez restreindre vos choix."
    )
    print("insert message submit_preferences? valeur de user_id: ", user_id)

    await insert_message(
        conversation_id=chat_id,
        sender_id=user_id,
        content=message,
        type_="system"
    )

    for _, ws in active_connections.get(chat_id, []):
        await ws.send_text(json.dumps({
            "type": "date_result",
            "status": "success" if activity and moment else "no_match",
            "message": message
        }))

    return {"success": True, "ok": True}

@router.get("/date_invite/status")
async def get_date_invite_status(request: Request, chat_id: int):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user

    # On utilise .mappings() dans la fonction appelée
    invite = await get_latest_invite(chat_id)
    if not invite:
        return {"status": None}

    sender_id = invite["sender_id"]

    from app.user.user_service import get_user_by_id
    sender = await get_user_by_id(sender_id)

    return {
        "status": invite["status"],
        "sender_id": sender_id,
        "sender_name": sender["username"]
    }