from sqlalchemy import insert, select, update
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.database import async_session
from app.tables.users import users_table
from bcrypt import hashpw, gensalt, checkpw


async def hash_password(password: str) -> str:
    """Hache le mot de passe pour le stockage."""
    return hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')

async def verify_password(password: str, hashed_password: str) -> bool:
    """Vérifie si un mot de passe correspond au haché."""
    return checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

async def add_user(email: str, username: str, first_name: str, last_name: str, password_hash: str):
    """Ajoute un utilisateur dans la base de données."""
    async with async_session() as session:  # Gestion de session asynchrone
        async with session.begin():  # Démarre une transaction
            query = insert(users_table).values(
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                password_hash=password_hash,
                created_at=datetime.utcnow(),
                status=True
            )
            await session.execute(query)

async def get_user_by_email(email: str):
    """Récupère un utilisateur par son email."""
    async with async_session() as session:
        query = select(users_table).where(users_table.c.email == email)
        result = await session.execute(query)
        user = result.fetchone()
        if user:
            return dict(user._mapping)  # `_mapping` contient les colonnes et leurs valeurs
        return None

async def get_user_by_id(id: str):
    """Récupère un utilisateur par son id."""
    async with async_session() as session:
        query = select(users_table).where(users_table.c.id == int(id))
        result = await session.execute(query)
        user = result.fetchone()
        if user:
            return dict(user._mapping)  # `_mapping` contient les colonnes et leurs valeurs
        return None

async def get_user_by_username(username: str):
    """Récupère un utilisateur par son username."""
    async with async_session() as session:
        query = select(users_table).where(users_table.c.username == username)
        result = await session.execute(query)
        user = result.fetchone()
        if user:
            return dict(user._mapping)  # `_mapping` contient les colonnes et leurs valeurs
        return None

async def authenticate_user(email: str, password: str) -> bool:
    """Vérifie les informations d'identification de l'utilisateur."""
    user = await get_user_by_email(email)
    if not user:
        return False
    return await verify_password(password, user["password_hash"])

async def save_profile_picture(user_id: int, image_bytes: bytes):
    async with async_session() as session:
        async with session.begin():
            query = profiles_table.update().where(profiles_table.c.user_id == user_id).values(
                profile_picture=image_bytes
            )
            await session.execute(query)

# async def add_user(email: str, password_hash: str):
#     """Ajoute un utilisateur dans la base de données."""
#     async with async_session() as session:
#         async with session.begin():
#             query = insert(users_table).values(
#                 email=email,
#                 password_hash=password_hash,
#                 created_at=datetime.utcnow(),
#                 status=True  # Le statut est défini sur "connecté" après l'inscription
#             )
#             await session.execute(query)

# async def update_user_status(email: str, status: bool):
#     """Met à jour le statut de l'utilisateur."""
#     async with async_session() as session:
#         async with session.begin():
#             query = update(users_table).where(users_table.c.email == email).values(status=status)
#             await session.execute(query)

async def update_user_status(user_id: str, status: bool):
    """Met à jour le statut de l'utilisateur en utilisant l'ID."""
    async with async_session() as session:
        async with session.begin():
            query = update(users_table).where(users_table.c.id == user_id).values(status=status)
            await session.execute(query)