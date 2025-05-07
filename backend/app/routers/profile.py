from app.utils.jwt_handler import verify_user_from_token
from fastapi import APIRouter, HTTPException, Request, Response
from app.profile.profile_service import get_profile_by_user_id, increment_fame_rating, upsert_profile
from app.user.user_service import get_user_by_id, update_user_info, get_user_by_email, get_user_by_username
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
        "email": user["email"],  # Explicitly include email from user data
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

@router.put("/{user_id}")
async def update_profile(user_id: int, request: Request, data: dict):
    """Met à jour le profil d'un utilisateur."""
    user = await verify_user_from_token(request)
    
    # Vérifier que l'utilisateur ne modifie que son propre profil
    if int(user["id"]) != int(user_id):
        raise HTTPException(status_code=403, detail="You can only update your own profile")
    
    # Extraire les données du profil
    gender = data.get("gender")
    sexual_preferences = data.get("sexual_preferences")
    biography = data.get("biography")
    birthday = data.get("birthday")
    
    # Gérer les intérêts qui peuvent être soit une liste, soit une chaîne à diviser
    interests = data.get("interests")
    if isinstance(interests, str):
        # Si c'est une chaîne, on la divise et nettoie
        interests = [tag.strip() for tag in interests.split(",") if tag.strip()]
    elif not isinstance(interests, list):
        interests = []
    
    # Mettre à jour le profil
    await upsert_profile(
        user_id=user_id,
        gender=gender,
        sexual_preferences=sexual_preferences,
        biography=biography,
        interests=interests,
        birthday=birthday
    )
    
    return {"message": "Profile updated successfully"}

@router.put("/user_info/{user_id}")
async def update_user_information(user_id: int, request: Request, data: dict):
    """Met à jour les informations de l'utilisateur (nom, prénom, email, username)."""
    user = await verify_user_from_token(request)
    
    # Vérifier que l'utilisateur ne modifie que ses propres informations
    if int(user["id"]) != int(user_id):
        raise HTTPException(status_code=403, detail="You can only update your own information")
    
    # Extraire les données utilisateur
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    username = data.get("username")
    
    # Valider les données
    if email and not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    if first_name and not re.match(r"^[a-zA-Z]+$", first_name):
        raise HTTPException(status_code=400, detail="Invalid first name")
    
    if last_name and not re.match(r"^[a-zA-Z]+$", last_name):
        raise HTTPException(status_code=400, detail="Invalid last name")
    
    if username and not re.match(r"^[a-zA-Z0-9_.-]+$", username):
        raise HTTPException(status_code=400, detail="Invalid username format")
    
    # Vérifier si l'email ou le username est déjà utilisé
    if email and email != user["email"]:
        existing_user = await get_user_by_email(email)
        if existing_user and existing_user["id"] != user_id:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    if username and username != user["username"]:
        existing_user = await get_user_by_username(username)
        if existing_user and existing_user["id"] != user_id:
            raise HTTPException(status_code=400, detail="Username already in use")
    
    # Mettre à jour l'utilisateur
    success = await update_user_info(
        user_id=user_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        username=username
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="No information to update")
    
    return {"message": "User information updated successfully"}
