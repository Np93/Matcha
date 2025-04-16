from sqlalchemy.sql import text
from app.utils.database import engine
from app.tables.blocks import blocks_table

async def block_user(blocker_id: int, blocked_id: int) -> None:
    """Bloque un utilisateur en l'insérant dans la table blocks, si non déjà présent."""
    async with engine.begin() as conn:
        query = text("""
            INSERT INTO blocks (blocker_id, blocked_id, created_at)
            VALUES (:blocker_id, :blocked_id, NOW())
            ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
        """)
        await conn.execute(query, {
            "blocker_id": blocker_id,
            "blocked_id": blocked_id,
        })

async def is_user_blocked(blocker_id: int, blocked_id: int) -> bool:
    """Vérifie si blocker_id a bloqué blocked_id."""
    async with engine.begin() as conn:
        query = text("""
            SELECT 1 FROM blocks
            WHERE blocker_id = :blocker_id AND blocked_id = :blocked_id
            LIMIT 1;
        """)
        result = await conn.execute(query, {
            "blocker_id": blocker_id,
            "blocked_id": blocked_id,
        })
        return result.first() is not None

async def are_users_blocked(user1_id: int, user2_id: int) -> bool:
    """Vérifie si l'un des deux utilisateurs a bloqué l'autre."""
    return await is_user_blocked(user1_id, user2_id) or await is_user_blocked(user2_id, user1_id)

async def get_blocked_users(blocker_id: int) -> list[dict]:
    """Retourne les utilisateurs bloqués par l'utilisateur connecté, avec leur ID et nom."""
    async with engine.begin() as conn:
        query = text("""
            SELECT users.id, users.username
            FROM blocks
            JOIN users ON blocks.blocked_id = users.id
            WHERE blocks.blocker_id = :blocker_id
        """)
        result = await conn.execute(query, {"blocker_id": blocker_id})
        rows = result.fetchall()
        return [{"id": row.id, "username": row.username} for row in rows]

async def unblock_users(blocker_id: int, blocked_ids: list[int]) -> None:
    """Supprime plusieurs relations de blocage entre l'utilisateur et les utilisateurs donnés."""
    async with engine.begin() as conn:
        query = text("""
            DELETE FROM blocks
            WHERE blocker_id = :blocker_id AND blocked_id = ANY(:blocked_ids)
        """)
        await conn.execute(query, {
            "blocker_id": blocker_id,
            "blocked_ids": blocked_ids,
        })

async def async_generator_filter(iterable, async_predicate):
    for item in iterable:
        if await async_predicate(item):
            yield item