from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
# from sqlalchemy.future import select
# from app.tables.chat import conversations_table, messages_table
from app.utils.database import async_session, engine
from datetime import datetime

async def get_conversation(user1_id: int, user2_id: int):
    """ Vérifie si une conversation entre 2 utilisateurs existe avec une requête SQL brute. """
    query = text("""
    SELECT * FROM conversations 
    WHERE (user1_id = :user1_id AND user2_id = :user2_id) 
       OR (user1_id = :user2_id AND user2_id = :user1_id)
    LIMIT 1;
    """)

    async with engine.begin() as conn:
        result = await conn.execute(query, {"user1_id": user1_id, "user2_id": user2_id})
        conversation = result.mappings().first()  # Retourne directement un dictionnaire

    return conversation  # Retourne None si aucune conversation trouvée

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

async def save_message(conversation_id: int, sender_id: int, content: str):
    """ Sauvegarde un message dans une conversation avec une requête SQL brute. """
    query = text("""
    INSERT INTO messages (conversation_id, sender_id, content, timestamp) 
    VALUES (:conversation_id, :sender_id, :content, :timestamp);
    """)

    async with engine.begin() as conn:
        await conn.execute(query, {
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "content": content,
            "timestamp": datetime.utcnow()
        })