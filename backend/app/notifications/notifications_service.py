from sqlalchemy.sql import text
from app.utils.database import engine
from app.profile.block_service import are_users_blocked

async def insert_notification(receiver_id: int, sender_id: int, notification_type: str, context: str):
    query = text("""
        INSERT INTO notifications (receiver_id, sender_id, type, context, timestamp, is_read)
        VALUES (:receiver_id, :sender_id, :type, :context, NOW(), FALSE)
        RETURNING id, timestamp
    """)
    async with engine.begin() as conn:
        result = await conn.execute(query, {
            "receiver_id": receiver_id,
            "sender_id": sender_id,
            "type": notification_type,
            "context": context
        })
        return result.fetchone()

async def fetch_notifications(user_id: int, unread_only: bool = False):
    base_query = """
        SELECT n.id, n.type, n.context, n.sender_id, n.timestamp, u.username, n.is_read
        FROM notifications n
        JOIN users u ON n.sender_id = u.id
        WHERE n.receiver_id = :user_id
    """
    if unread_only:
        base_query += " AND n.is_read = FALSE"
    base_query += " ORDER BY n.timestamp DESC"

    query = text(base_query)
    async with engine.begin() as conn:
        result = await conn.execute(query, {"user_id": user_id})
        return [dict(row._mapping) for row in result.fetchall()]

async def mark_notifications_as_read(user_id: int, notification_ids: list):
    query = text("""
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE receiver_id = :user_id 
        AND id = ANY(:notification_ids) 
        AND is_read = FALSE
    """)
    async with engine.begin() as conn:
        await conn.execute(query, {"user_id": user_id, "notification_ids": notification_ids})

async def can_send_notification(receiver_id: int, sender_id: int) -> bool:
    return not await are_users_blocked(receiver_id, sender_id)