from sqlalchemy.sql import text
from app.utils.database import engine
import base64
import json
from datetime import datetime

async def create_conversation(user1_id: int, user2_id: int):
    """ Crée une nouvelle conversation entre 2 utilisateurs avec une requête SQL brute. """
    query = text("""
    INSERT INTO conversations (user1_id, user2_id, created_at) 
    VALUES (:user1_id, :user2_id, :created_at)
    RETURNING id;
    """)

    async with engine.begin() as conn:
        result = await conn.execute(query, {
            "user1_id": user1_id,
            "user2_id": user2_id,
            "created_at": datetime.utcnow()
        })
        conversation_id = result.scalar()  # Récupère l'ID retourné par RETURNING

    return conversation_id

async def get_user_conversations_from_db(user_id: int):
    query = text("""
        SELECT c.id AS conversation_id, 
               u.id AS other_user_id, 
               u.username AS other_username, 
               pp.image_data AS profile_picture,
               u.status AS is_online
        FROM conversations c
        JOIN users u ON 
            (c.user1_id = :user_id AND c.user2_id = u.id) OR
            (c.user2_id = :user_id AND c.user1_id = u.id)
        LEFT JOIN profile_pictures pp ON u.id = pp.user_id AND pp.is_profile_picture = TRUE
        ORDER BY c.created_at DESC
    """)
    async with engine.begin() as conn:
        result = await conn.execute(query, {"user_id": user_id})
        return result.fetchall()

async def get_messages_from_conversation(conversation_id: int):
    query = text("""
        SELECT id, sender_id, content, timestamp, type
        FROM messages 
        WHERE conversation_id = :conversation_id 
        ORDER BY timestamp ASC
    """)
    async with engine.begin() as conn:
        result = await conn.execute(query, {"conversation_id": conversation_id})
        return result.fetchall()

async def get_conversation_users(conversation_id: int):
    query = text("""
        SELECT user1_id, user2_id FROM conversations WHERE id = :conversation_id
    """)
    async with engine.begin() as conn:
        result = await conn.execute(query, {"conversation_id": conversation_id})
        return result.fetchone()

async def insert_message(conversation_id: int, sender_id: int | None, content: str, type_: str = "text") -> dict:
    now = datetime.utcnow()
    query = text("""
        INSERT INTO messages (conversation_id, sender_id, content, type, timestamp, is_read)
        VALUES (:conversation_id, :sender_id, :content, :type, :timestamp, FALSE)
        RETURNING id, timestamp
    """)
    print(sender_id)

    async with engine.begin() as conn:
        result = await conn.execute(query, {
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "content": content,
            "type": type_,
            "timestamp": now,
        })
        return result.fetchone()


async def insert_date_invite(conversation_id: int, sender_id: int):
    async with engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO date_invites (conversation_id, sender_id, status)
            VALUES (:conversation_id, :sender_id, 'pending')
            ON CONFLICT DO NOTHING
        """), {"conversation_id": conversation_id, "sender_id": sender_id})

async def get_latest_invite(conversation_id: int):
    async with engine.begin() as conn:
        result = await conn.execute(text("""
            SELECT * FROM date_invites
            WHERE conversation_id = :conversation_id
            ORDER BY created_at DESC
            LIMIT 1
        """), {"conversation_id": conversation_id})
        return result.mappings().first()

async def update_invite_status(conversation_id: int, status: str):
    async with engine.begin() as conn:
        await conn.execute(text("""
            UPDATE date_invites
            SET status = :status, updated_at = NOW()
            WHERE conversation_id = :conversation_id
        """), {"conversation_id": conversation_id, "status": status})

async def save_user_preferences(conversation_id: int, user_id: int, moments: list, activities: list):
    moments_json = json.dumps(moments)
    activities_json = json.dumps(activities)

    async with engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO date_preferences (conversation_id, user_id, moments, activities)
            VALUES (:conversation_id, :user_id, :moments, :activities)
            ON CONFLICT (conversation_id, user_id) DO UPDATE
            SET moments = :moments, activities = :activities, updated_at = NOW()
        """), {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "moments": moments_json,
            "activities": activities_json
        })

async def get_preferences(conversation_id: int):
    import json
    async with engine.begin() as conn:
        result = await conn.execute(text("""
            SELECT user_id, moments, activities
            FROM date_preferences
            WHERE conversation_id = :conversation_id
        """), {"conversation_id": conversation_id})
        rows = result.fetchall()
        return [
            {
                "user_id": row.user_id,
                "moments": json.loads(row.moments),
                "activities": json.loads(row.activities)
            } for row in rows
        ]