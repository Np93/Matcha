from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from app.chat.chat_service import get_conversation, create_conversation, save_message
from app.utils.jwt_handler import verify_user_from_token, verify_user_from_socket_token
from sqlalchemy.sql import text
from app.tables.chat import messages_table, conversations_table
from app.routers.notifications import send_notification
from app.utils.database import async_session
from jose import JWTError, jwt
import json

router = APIRouter()

#  Stockage des connexions WebSocket actives
active_connections = {}

# recupere tout les conversation disponible
@router.get("/conversations")
async def get_user_conversations(request: Request):
    # Vérifie le token et récupère l'ID utilisateur
    print("je suis dans conversation")
    user = await verify_user_from_token(request)
    user_id = user["id"]

    async with async_session() as session:
        async with session.begin():
            # Requête SQL pour récupérer toutes les conversations d'un utilisateur
            query = text("""
                SELECT c.id AS conversation_id, 
                       u.id AS other_user_id, 
                       u.username AS other_username, 
                       pp.image_data AS profile_picture,
                       u.status AS is_online  -- Récupération du statut de connexion
                FROM conversations c
                JOIN users u ON 
                    (c.user1_id = :user_id AND c.user2_id = u.id) OR
                    (c.user2_id = :user_id AND c.user1_id = u.id)
                LEFT JOIN profile_pictures pp ON u.id = pp.user_id AND pp.is_profile_picture = TRUE
                ORDER BY c.created_at DESC
            """)
            result = await session.execute(query, {"user_id": user_id})
            conversations = result.fetchall()

    # Formate les données pour le front-end
    formatted_conversations = [
        {
            "id": row.conversation_id,
            "name": row.other_username,
            "avatar": row.profile_picture if row.profile_picture else None,
            "isOnline": row.is_online,  # Cette donnée peut être mise à jour avec un système de présence en ligne
        }
        for row in conversations
    ]

    return formatted_conversations

#  API pour récupérer les messages d'une conversation
@router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: int, request: Request):
    """Récupère les messages stockés dans la base de données"""
    user = await verify_user_from_token(request)
    
    async with async_session() as session:
        async with session.begin():
            query = text("""
                SELECT id, sender_id, content, timestamp 
                FROM messages 
                WHERE conversation_id = :conversation_id 
                ORDER BY timestamp ASC
            """)
            result = await session.execute(query, {"conversation_id": conversation_id})
            messages = [{"id": row.id, "sender_id": row.sender_id, "content": row.content, "timestamp": str(row.timestamp)} for row in result.fetchall()]
    
    return messages

# #  API pour envoyer un message et save dans la db
# @router.post("/send")
# async def send_message(request: Request, data: dict):
#     """Stocke le message dans la DB et l’envoie via WebSocket si le destinataire est connecté."""
#     user = await verify_user_from_token(request)
#     sender_id = user["id"]
#     conversation_id = data["chat_id"]
#     content = data["content"]

#     #  Stocker le message en DB
#     async with async_session() as session:
#         async with session.begin():
#             insert_query = text("""
#                 INSERT INTO messages (conversation_id, sender_id, content, timestamp, is_read) 
#                 VALUES (:conversation_id, :sender_id, :content, NOW(), FALSE)
#                 RETURNING id, timestamp
#             """)
#             result = await session.execute(insert_query, {
#                 "conversation_id": conversation_id,
#                 "sender_id": sender_id,
#                 "content": content
#             })
#             message_id, timestamp = result.fetchone()

#     #  Vérifier si l’autre utilisateur est connecté via WebSocket
#     if conversation_id in active_connections:
#         for user_socket in active_connections[conversation_id]:
#             _, ws = user_socket
#             await ws.send_text(json.dumps({
#                 "id": message_id,
#                 "sender_id": sender_id,
#                 "content": content,
#                 "timestamp": str(timestamp),
#             }))

#     return {"message": "Message sent successfully"}

@router.post("/send")
async def send_message(request: Request, data: dict):
    """Stocke le message dans la DB et l’envoie via WebSocket si le destinataire est connecté.
       Si le destinataire est hors ligne, une notification lui est envoyée.
    """
    # 🔹 Vérifier l'utilisateur à partir du token
    user = await verify_user_from_token(request)
    sender_id = user["id"]
    conversation_id = data["chat_id"]
    content = data["content"]

    # 🔹 Récupérer l'autre utilisateur de la conversation
    async with async_session() as session:
        async with session.begin():
            query = text("""
                SELECT user1_id, user2_id FROM conversations WHERE id = :conversation_id
            """)
            result = await session.execute(query, {"conversation_id": conversation_id})
            conversation = result.fetchone()
            
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation introuvable")

            # Déterminer qui est le destinataire
            receiver_id = conversation.user1_id if conversation.user2_id == sender_id else conversation.user2_id

    # 🔹 Stocker le message en base de données
    async with async_session() as session:
        async with session.begin():
            insert_query = text("""
                INSERT INTO messages (conversation_id, sender_id, content, timestamp, is_read) 
                VALUES (:conversation_id, :sender_id, :content, NOW(), FALSE)
                RETURNING id, timestamp
            """)
            result = await session.execute(insert_query, {
                "conversation_id": conversation_id,
                "sender_id": sender_id,
                "content": content
            })
            message_id, timestamp = result.fetchone()

    # 🔹 Envoyer le message à l'expéditeur (assurer qu'il voit son propre message)
    if conversation_id in active_connections:
        for user_socket in active_connections[conversation_id]:
            user_socket_id, ws = user_socket
            if user_socket_id == sender_id:  # Assurer que l'expéditeur reçoit son message
                await ws.send_text(json.dumps({
                    "id": message_id,
                    "sender_id": sender_id,
                    "content": content,
                    "timestamp": str(timestamp),
                }))

    # 🔹 Vérifier si le destinataire est connecté et lui envoyer le message en direct
    recipient_connected = False
    if conversation_id in active_connections:
        for user_socket in active_connections[conversation_id]:
            other_user_id, ws = user_socket
            if other_user_id == receiver_id:  # Envoyer uniquement au destinataire
                recipient_connected = True
                await ws.send_text(json.dumps({
                    "id": message_id,
                    "sender_id": sender_id,
                    "content": content,
                    "timestamp": str(timestamp),
                }))

    # 🔹 Si le destinataire est **hors ligne**, enregistrer une notification
    if not recipient_connected:
        await send_notification(
            receiver_id=receiver_id,  # Le destinataire reçoit la notification
            sender_id=sender_id,  # L'expéditeur du message
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