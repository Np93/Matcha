from sqlalchemy import text
from app.utils.database import engine

async def is_oauth_account_linked(email: str) -> bool:
    query = text("""
        SELECT oa.id
        FROM oauth_accounts oa
        JOIN users u ON oa.user_id = u.id
        WHERE u.email = :email AND oa.provider = 'google'
    """)
    async with engine.begin() as conn:
        result = await conn.execute(query, {"email": email})
        return result.first() is not None

async def link_oauth_account(user_id: int, google_id: str) -> None:
    async with engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
            VALUES (:user_id, 'google', :provider_user_id)
            ON CONFLICT DO NOTHING
        """), {
            "user_id": user_id,
            "provider_user_id": google_id
        })