from app.utils.jwt_handler import verify_user_from_token
from fastapi import APIRouter, HTTPException, Request, Response
from app.profile.profile_service import get_profile_by_user_id
import logging
import re

router = APIRouter()

# Logger pour déboguer
logger = logging.getLogger(__name__)

@router.get("/")
async def get_profile(request: Request):
    print("pouruuuuuuurrrrquuuuoi")
    print("je suis dans profile")
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