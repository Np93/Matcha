from fastapi import APIRouter, Request, HTTPException, WebSocket, WebSocketDisconnect
from jose import JWTError
from app.utils.jwt_handler import verify_user_from_token, verify_user_from_socket_token
from app.notifications.notifications_service import (
    insert_notification,
    fetch_notifications,
    mark_notifications_as_read,
    can_send_notification
)
from app.match.match_service import check_if_unliked
import json

router = APIRouter()
notification_connections = {}

@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await websocket.accept()
    token = websocket.cookies.get("access_token")

    if not token:
        await websocket.close(code=1008)
        return

    try:
        user = await verify_user_from_socket_token(token)
        user_id = user["id"]
    except JWTError:
        await websocket.close(code=1008)
        return

    if user_id in notification_connections:
        try:
            await notification_connections[user_id].close()
        except Exception:
            pass
    notification_connections[user_id] = websocket

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_connections.pop(user_id, None)

@router.get("/notifications")
async def get_notifications(request: Request):
    user = await verify_user_from_token(request)
    notifications = await fetch_notifications(user["id"])
    return notifications

@router.get("/notifications/unread")
async def get_unread_notifications(request: Request):
    user = await verify_user_from_token(request)
    notifications = await fetch_notifications(user["id"], unread_only=True)
    return notifications

@router.post("/mark-read")
async def mark_read(request: Request, data: dict):
    user = await verify_user_from_token(request)
    notification_ids = data.get("notification_ids", [])
    if not notification_ids:
        raise HTTPException(status_code=400, detail="No notifications provided")
    await mark_notifications_as_read(user["id"], notification_ids)
    return {"message": "Notifications marked as read"}

async def send_notification(receiver_id, sender_id, notification_type, context):
    if not await can_send_notification(receiver_id, sender_id):
        return

    if await check_if_unliked(receiver_id, sender_id):
        return

    notif = await insert_notification(receiver_id, sender_id, notification_type, context)
    if receiver_id in notification_connections:
        ws = notification_connections[receiver_id]
        await ws.send_text(json.dumps({
            "id": notif[0],
            "type": notification_type,
            "context": context,
            "sender_id": sender_id,
            "timestamp": str(notif[1]),
            "is_read": False
        }))