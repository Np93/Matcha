from app.utils.jwt_handler import verify_user_from_token
from fastapi import APIRouter, HTTPException, Request, Response
from app.profile.profile_service import get_profile_by_user_id, increment_fame_rating
from app.user.user_service import get_user_by_id
from app.routers.notifications import send_notification
from app.match.match_service import get_liked_user_ids, check_if_unliked
from app.profile.block_service import block_user, is_user_blocked
from app.profile.picture_service import get_pictures_of_user
from app.profile.picture_service import get_main_picture_of_user
from app.profile.report_service import insert_report, count_reports_against_user, delete_user_by_id
from app.utils.database import engine
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

    # Récupération des images via le service
    profile_pictures = await get_pictures_of_user(user["id"])

    # Retourner les informations utilisateur
    return {
        "id": user["id"],
        "username": user["username"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        **profile_data,
        "profile_pictures": profile_pictures
    }

# @router.get("/user/{user_id}")
# async def get_user_profile(user_id: int, request: Request):
#     user_requesting = await verify_user_from_token(request)

#     profile_data = await get_profile_by_user_id(user_id)
#     user = await get_user_by_id(user_id)
#     if not profile_data:
#         raise HTTPException(status_code=404, detail="Profile not found")

#     await send_notification(
#         receiver_id=user_id,  # Celui qui reçoit la notif (le propriétaire du profil visité)
#         sender_id=user_requesting["id"],    # Celui qui visite le profil
#         notification_type="visite",
#         context=f"{user_requesting['username']} a visité votre profil."
#     )

#     return {
#         "id": user_id,
#         "username": user["username"],
#         "first_name": user["first_name"],
#         "last_name": user["last_name"],
#         "status": user["status"],
#         "laste_connexion": user["laste_connexion"],
#         **profile_data,
#     }

@router.get("/user/{user_id}")
async def get_user_profile(user_id: int, request: Request):
    """Récupère le profil d'un utilisateur et vérifie s'il a déjà été liké."""
    user_requesting = await verify_user_from_token(request)

    await increment_fame_rating(user_id)

    async with engine.begin() as conn:
        profile_data = await get_profile_by_user_id(user_id)
        user = await get_user_by_id(user_id)
        if not profile_data:
            raise HTTPException(status_code=404, detail="Profile not found")

        liked_user_ids = await get_liked_user_ids(conn, user_requesting["id"])
        is_liked = user_id in liked_user_ids

        unlike = await check_if_unliked(user_requesting["id"], user_id)

        profile_pictures = await get_pictures_of_user(user_id)

        has_main_picture = bool(await get_main_picture_of_user(user_requesting["id"]))

        await send_notification(
            receiver_id=user_id,
            sender_id=user_requesting["id"],
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
            "liked": is_liked,
            "unlike": unlike,
            **profile_data,
            "can_like": has_main_picture,
            "profile_pictures": profile_pictures
        }

@router.post("/block")
async def block(request: Request, data: dict):
    user = await verify_user_from_token(request)
    target_id = data.get("targetId")

    if not target_id or target_id == user["id"]:
        raise HTTPException(status_code=400, detail="Invalid target")
    
    # is_bloked = await is_user_blocked(user["id"], target_id)

    # print("on vas bloquer la personne")
    await block_user(user["id"], target_id)
    # print("la personne est bloquer")
    # print(is_bloked)
    return {"message": "User blocked successfully"}

@router.post("/report")
async def report_user(request: Request, data: dict):
    user = await verify_user_from_token(request)
    reporter_id = user["id"]
    reported_id = data.get("targetId")

    if reporter_id == reported_id:
        raise HTTPException(status_code=400, detail="You cannot report yourself")

    # Insertion + vérification doublon
    success = await insert_report(reporter_id, reported_id)
    if not success:
        raise HTTPException(status_code=400, detail="You already reported this user")

    # Compter les signalements reçus
    count = await count_reports_against_user(reported_id)

    # Supprimer le compte si trop de reports
    if count >= 3:
        await delete_user_by_id(reported_id)

    return {"message": "User reported successfully", "reports": count}
    