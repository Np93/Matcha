from app.utils.jwt_handler import verify_user_from_token
from fastapi import APIRouter, HTTPException, Request, Response
from app.profile.profile_service import get_profile_by_user_id
from app.user.user_service import get_user_by_id
from app.routers.notifications import send_notification
import logging
import re

router = APIRouter()

# Logger pour déboguer
logger = logging.getLogger(__name__)

@router.get("/")
async def get_profile(request: Request):
    user = await verify_user_from_token(request)  # Vérifie l'access token

    # Récupérer uniquement les informations de profil
    profile_data = await get_profile_by_user_id(user["id"])
    print("ceci est les information dans profile_data dans la route: ", profile_data)
    if not profile_data:
        raise HTTPException(status_code=401, detail="Profile not found")
    # Retourner les informations utilisateur
    return {
        "id": user["id"],
        "username": user["username"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        **profile_data,
    }

@router.get("/user/{user_id}")
async def get_user_profile(user_id: int, request: Request):
    user_requesting = await verify_user_from_token(request)

    profile_data = await get_profile_by_user_id(user_id)
    user = await get_user_by_id(user_id)
    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    await send_notification(
        receiver_id=user_id,  # Celui qui reçoit la notif (le propriétaire du profil visité)
        sender_id=user_requesting["id"],    # Celui qui visite le profil
        notification_type="visite",
        context=f"{user_requesting['username']} a visité votre profil."
    )

    return {
        "id": user_id,
        "username": user["username"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "status": user["status"],
        "laste_connexion": user["laste_connexion"],
        **profile_data,
    }