from fastapi import APIRouter, HTTPException, Request
from app.utils.jwt_handler import verify_user_from_token
from app.utils.database import async_session
from app.tables.users import users_table
from app.tables.chat import conversations_table
from app.tables.profile import profiles_table
from app.tables.likes import likes_table
from app.user.user_service import get_user_by_id
from app.routers.notifications import send_notification
from sqlalchemy.sql import text
import json

router = APIRouter()

#  Récupérer tous les profils sauf celui de l'utilisateur connecté
@router.get("/profiles")
async def get_profiles(request: Request):
    print("on est dans match/profiles")
    user = await verify_user_from_token(request)
    user_id = user["id"]  # ID de l'utilisateur connecté
    async with async_session() as session:
        async with session.begin(): # il faudra ajouter les photos par la suite
            query = text("""
            SELECT users.id, users.username 
            FROM users
            LEFT JOIN profiles ON users.id = profiles.user_id
            WHERE users.id != :user_id
            """)
            result = await session.execute(query, {"user_id": user_id})
            profiles = result.mappings().all()
    return profiles


#  Gérer les likes et création de chat si match
@router.post("/like")
async def like_profile(request: Request, data: dict):
    user = await verify_user_from_token(request)
    liker_id = user["id"]
    liked_id = data.get("targetId")
    user_liked = await get_user_by_id(liked_id)

    if liker_id == liked_id:
        raise HTTPException(status_code=400, detail="You cannot like yourself")

    async with async_session() as session:
        async with session.begin():
            # Vérifie si l'autre utilisateur a déjà liké
            check_query = text("""
                SELECT * FROM likes WHERE liker_id = :liked_id AND liked_id = :liker_id
            """)
            check_result = await session.execute(check_query, {"liked_id": liked_id, "liker_id": liker_id})
            match_found = check_result.fetchone()

            # Insère le like avec created_at
            insert_query = text("""
                INSERT INTO likes (liker_id, liked_id, created_at)
                VALUES (:liker_id, :liked_id, NOW())
                ON CONFLICT DO NOTHING
            """)
            await session.execute(insert_query, {"liker_id": liker_id, "liked_id": liked_id})

            # Crée une conversation si un match est trouvé
            if match_found:
                create_chat_query = text("""
                    INSERT INTO conversations (user1_id, user2_id, created_at)
                    VALUES (:user1_id, :user2_id, NOW())
                    ON CONFLICT DO NOTHING
                """)
                await session.execute(create_chat_query, {"user1_id": liker_id, "user2_id": liked_id})
                
                # Enregistre la notification de match pour les deux utilisateurs
                await send_notification(
                    receiver_id=liker_id,
                    sender_id=liked_id,
                    notification_type="match",
                    context=f"Vous avez matché avec {user_liked['username']} ! 🎉"
                )

                await send_notification(
                    receiver_id=liked_id,
                    sender_id=liker_id,
                    notification_type="match",
                    context=f"Vous avez matché avec {user['username']} ! 🎉"
                )
                return {"matched": True}

    return {"matched": False}