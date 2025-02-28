from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.database import engine
# from app.tables.users import users_table
from bcrypt import hashpw, gensalt, checkpw
from sqlalchemy.sql import text

async def hash_password(password: str) -> str:
    """Hache le mot de passe pour le stockage."""
    return hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')

async def verify_password(password: str, hashed_password: str) -> bool:
    """Vérifie si un mot de passe correspond au haché."""
    return checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

async def add_user(email: str, username: str, first_name: str, last_name: str, password_hash: str):
    """Ajoute un utilisateur dans la base de données en SQL."""
    query = text("""
    INSERT INTO users (email, username, first_name, last_name, password_hash, created_at, status, laste_connexion)
    VALUES (:email, :username, :first_name, :last_name, :password_hash, :created_at, :status, :laste_connexion);
    """)
    
    async with engine.begin() as conn:
        await conn.execute(query, {
            "email": email,
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
            "password_hash": password_hash,
            "created_at": datetime.utcnow(),
            "status": True,
            "laste_connexion": datetime.utcnow()
        })

async def get_user_by_email(email: str):
    """Récupère un utilisateur par son email en SQL."""
    query = text("SELECT * FROM users WHERE email = :email LIMIT 1;")

    async with engine.begin() as conn:
        result = await conn.execute(query, {"email": email})
        user = result.fetchone()
    
    return dict(user._mapping) if user else None

async def get_user_by_id(id: str):
    """Récupère un utilisateur par son ID en SQL."""
    query = text("SELECT * FROM users WHERE id = :id LIMIT 1;")

    async with engine.begin() as conn:
        result = await conn.execute(query, {"id": int(id)})
        user = result.fetchone()
    
    return dict(user._mapping) if user else None

async def get_user_by_username(username: str):
    """Récupère un utilisateur par son username en SQL."""
    query = text("SELECT * FROM users WHERE username = :username LIMIT 1;")

    async with engine.begin() as conn:
        result = await conn.execute(query, {"username": username})
        user = result.fetchone()
    
    return dict(user._mapping) if user else None

async def authenticate_user(email: str, password: str) -> bool:
    """Vérifie les informations d'identification de l'utilisateur."""
    user = await get_user_by_email(email)
    if not user:
        return False
    return checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8'))

async def save_profile_picture(user_id: int, image_bytes: bytes):
    """Sauvegarde une photo de profil pour un utilisateur en SQL."""
    query = text("UPDATE profiles SET profile_picture = :image_bytes WHERE user_id = :user_id;")

    async with engine.begin() as conn:
        await conn.execute(query, {"user_id": user_id, "image_bytes": image_bytes})

async def update_user_status(user_id: str, status: bool):
    """Met à jour le statut de l'utilisateur et enregistre la dernière connexion."""
    query = text("""
        UPDATE users 
        SET status = :status, laste_connexion = :laste_connexion 
        WHERE id = :user_id;
    """)

    async with engine.begin() as conn:
        await conn.execute(query, {
            "user_id": user_id,
            "status": status,
            "laste_connexion": datetime.utcnow()  # Enregistre l'heure actuelle en UTC
        })