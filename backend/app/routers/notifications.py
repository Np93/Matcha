from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from app.utils.jwt_handler import verify_user_from_token, verify_user_from_socket_token
from app.utils.database import async_session
from app.tables.notifications import notifications_table
from jose import JWTError
import json

router = APIRouter()

#  Stockage des connexions WebSocket pour les notifications
notification_connections = {}

#  WebSocket pour recevoir des notifications en temps réel
@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    """Gère les connexions WebSocket pour les notifications."""
    await websocket.accept()
    token = websocket.cookies.get("access_token")

    if not token:
        await websocket.close(code=1008)  # 1008 : Policy Violation
        return

    try:
        user = await verify_user_from_socket_token(token)
        user_id = user["id"]
    except JWTError:
        await websocket.close(code=1008)
        return

    #  Associer le WebSocket à l’utilisateur
    notification_connections[user_id] = websocket

    try:
        while True:
            await websocket.receive_text()  # Maintient la connexion active
    except WebSocketDisconnect:
        notification_connections.pop(user_id, None)

#  **Récupération des notifications d'un utilisateur**
@router.get("/notifications")
async def get_notifications(request: Request):
    """Récupère les notifications d'un utilisateur triées par date."""
    user = await verify_user_from_token(request)
    user_id = user["id"]

    async with async_session() as session:
        async with session.begin():
            query = text("""
                SELECT n.id, n.type, n.context, n.sender_id, n.timestamp, u.username, n.is_read
                FROM notifications n
                JOIN users u ON n.sender_id = u.id
                WHERE n.receiver_id = :user_id
                ORDER BY n.timestamp DESC
            """)
            result = await session.execute(query, {"user_id": user_id})
            notifications = [
                {
                    "id": row.id,
                    "type": row.type,
                    "context": row.context,
                    "sender_id": row.sender_id,
                    "sender_name": row.username,
                    "timestamp": str(row.timestamp),
                    "is_read": row.is_read
                }
                for row in result.fetchall()
            ]

    return notifications

@router.get("/notifications/unread")
async def get_unread_notifications(request: Request):
    """Récupère uniquement les notifications non lues d'un utilisateur."""
    user = await verify_user_from_token(request)
    user_id = user["id"]

    async with async_session() as session:
        async with session.begin():
            query = text("""
                SELECT n.id, n.type, n.context, n.sender_id, n.timestamp, u.username, n.is_read
                FROM notifications n
                JOIN users u ON n.sender_id = u.id
                WHERE n.receiver_id = :user_id AND n.is_read = FALSE
                ORDER BY n.timestamp DESC
            """)
            result = await session.execute(query, {"user_id": user_id})
            notifications = [
                {
                    "id": row.id,
                    "type": row.type,
                    "context": row.context,
                    "sender_id": row.sender_id,
                    "sender_name": row.username,
                    "timestamp": str(row.timestamp),
                    "is_read": row.is_read
                }
                for row in result.fetchall()
            ]

    return notifications

@router.post("/mark-read")
async def mark_notifications_as_read(request: Request, data: dict):
    """Marque les notifications envoyées en paramètre comme lues après vérification."""
    user = await verify_user_from_token(request)
    user_id = user["id"]

    notification_ids = data.get("notification_ids", [])

    if not notification_ids:
        raise HTTPException(status_code=400, detail="Aucune notification à mettre à jour")

    async with async_session() as session:
        async with session.begin():
            # Mettre à jour seulement les notifications qui appartiennent à l'utilisateur connecté
            update_query = text("""
                UPDATE notifications 
                SET is_read = TRUE 
                WHERE receiver_id = :user_id 
                AND id = ANY(:notification_ids) 
                AND is_read = FALSE
            """)
            await session.execute(update_query, {"user_id": user_id, "notification_ids": notification_ids})

    return {"message": "Notifications mises à jour avec succès"}

#  **Fonction pour envoyer une notification**
async def send_notification(receiver_id, sender_id, notification_type, context):
    """Insère une notification en base et l'envoie via WebSocket si le destinataire est connecté."""
    async with async_session() as session:
        async with session.begin():
            insert_query = text("""
                INSERT INTO notifications (receiver_id, sender_id, type, context, timestamp, is_read)
                VALUES (:receiver_id, :sender_id, :type, :context, NOW(), FALSE)
                RETURNING id, timestamp
            """)
            result = await session.execute(insert_query, {
                "receiver_id": receiver_id,
                "sender_id": sender_id,
                "type": notification_type,
                "context": context
            })
            notification_id, timestamp = result.fetchone()

    #  **Envoyer la notification en direct si le destinataire est connecté**
    if receiver_id in notification_connections:
        ws = notification_connections[receiver_id]
        await ws.send_text(json.dumps({
            "id": notification_id,
            "type": notification_type,
            "context": context,
            "sender_id": sender_id,
            "timestamp": str(timestamp),
            "is_read": False
        }))