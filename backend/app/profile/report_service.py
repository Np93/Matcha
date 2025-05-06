from sqlalchemy.sql import text
from app.utils.database import engine

async def insert_report(reporter_id: int, reported_id: int) -> bool:
    """Insère un report. Retourne False si doublon (via contrainte unique)."""
    try:
        async with engine.begin() as conn:
            await conn.execute(
                text("""
                    INSERT INTO reports (reporter_id, reported_id)
                    VALUES (:reporter_id, :reported_id)
                """),
                {"reporter_id": reporter_id, "reported_id": reported_id}
            )
        return True
    except Exception:
        return False

async def count_reports_against_user(user_id: int) -> int:
    """Retourne le nombre de fois qu’un utilisateur a été signalé."""
    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT COUNT(*) FROM reports WHERE reported_id = :reported_id"),
            {"reported_id": user_id}
        )
        return result.scalar_one()

async def delete_user_by_id(user_id: int):
    """Supprime complètement l'utilisateur et tout ce qui lui est lié."""
    async with engine.begin() as conn:
        await conn.execute(
            text("DELETE FROM users WHERE id = :id"),
            {"id": user_id}
        )