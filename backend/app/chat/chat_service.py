from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.tables.chat import conversations_table, messages_table
from app.utils.database import async_session
from datetime import datetime

async def get_conversation(user1_id: int, user2_id: int):
    """ Vérifie si une conversation entre 2 utilisateurs existe """
    async with async_session() as session:
        query = await session.execute(
            select(conversations_table).where(
                ((conversations_table.c.user1_id == user1_id) & (conversations_table.c.user2_id == user2_id)) |
                ((conversations_table.c.user1_id == user2_id) & (conversations_table.c.user2_id == user1_id))
            )
        )
        return query.mappings().first()

async def create_conversation(user1_id: int, user2_id: int):
    """ Crée une nouvelle conversation entre 2 utilisateurs """
    async with async_session() as session:
        query = conversations_table.insert().values(
            user1_id=user1_id,
            user2_id=user2_id,
            created_at=datetime.utcnow()
        ).returning(conversations_table.c.id)
        
        result = await session.execute(query)
        await session.commit()
        return result.scalar()

async def save_message(conversation_id: int, sender_id: int, content: str):
    """ Sauvegarde un message dans une conversation """
    async with async_session() as session:
        query = messages_table.insert().values(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            timestamp=datetime.utcnow()
        )
        await session.execute(query)
        await session.commit()