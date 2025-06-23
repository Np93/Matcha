from fastapi import APIRouter, Request
from app.utils.jwt_handler import verify_user_from_token
from app.utils.database import engine
from fastapi.responses import JSONResponse
from app.chat.chat_service import create_conversation
from app.match.match_service import check_same_like, insert_like, check_match, get_liked_user_ids, get_matching_profiles, enrich_profiles, sort_profiles, set_unlike_status, check_if_unliked
from app.user.user_service import get_user_by_id
from app.profile.block_service import are_users_blocked, async_generator_filter
from app.profile.location_service import haversine, get_user_location, is_map_enabled_for_user
from app.routers.notifications import send_notification
from app.profile.profile_service import get_profile_by_user_id, increment_fame_rating
from app.profile.picture_service import get_main_picture_of_user
import json

router = APIRouter()

@router.get("/profiles")
async def get_profiles(request: Request):
    """Récupère les profils selon les préférences avec enrichissement."""
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    user_id = user["id"]

    async with engine.begin() as conn:
        map_enabled = await is_map_enabled_for_user(conn, user_id)
        # Récupérer localisation user (via `locations_service`)
        try:
            user_lat, user_lon = await get_user_location(conn, user_id)
        except Exception:
            return {"success": False, "detail": "Localisation non trouvée."}

        # Récupérer profil user (via `profile_service`)
        user_profile = await get_profile_by_user_id(user_id)
        gender, preferences, user_interests = (
            user_profile["gender"], 
            user_profile["sexual_preferences"], 
            user_profile["interests"]
        )

        # Récupérer profils likés (via `match_service`)
        liked_user_ids = await get_liked_user_ids(conn, user_id)

        # Récupérer profils selon préférences (via `match_service`)
        profiles = await get_matching_profiles(conn, user_id, gender, preferences)

        # Ajouter distance, âge et tags communs (via `match_service`)
        profiles_with_details = await enrich_profiles(
            user_lat, user_lon, user_interests, liked_user_ids, profiles, include_coords=map_enabled
        )

    async def is_not_blocked(profile):
        return not await are_users_blocked(user_id, profile["id"])

    not_blocked_profiles = [
        profile async for profile in async_generator_filter(profiles_with_details, is_not_blocked)
    ]

    # Trier les profils selon distance > tags > fame rating
    sorted_profiles = await sort_profiles(not_blocked_profiles)

    for profile in sorted_profiles:
        profile["main_picture"] = await get_main_picture_of_user(profile["id"])

    has_main_picture = bool(await get_main_picture_of_user(user_id))
    
    result = {
        "can_like": has_main_picture,
        "profiles": sorted_profiles,
    }

    if map_enabled:
        result["user_location"] = {
            "latitude": user_lat,
            "longitude": user_lon
        }

    return result
    
@router.get("/filter_profiles")
async def filter_profiles(request: Request):
    """Récupère les profils filtrés par âge, distance, célébrité et tags."""
    # Récupérer les filtres envoyés (GET query params)
    query_params = request.query_params

    # Extraire les filtres avec valeurs par défaut
    minAge = int(query_params.get("minAge", 18))
    maxAge = int(query_params.get("maxAge", 99))
    minDistance = int(query_params.get("minDistance", 0))
    maxDistance = query_params.get("maxDistance", "world")
    minFame = int(query_params.get("minFame", 1)) * 10
    maxFame = int(query_params.get("maxFame", 5)) * 10
    filterByTags = query_params.get("filterByTags", "false").lower() == "true"
   
    #Vérifier l'utilisateur connecté
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    user_id = user["id"]

    async with engine.begin() as conn:
        map_enabled = await is_map_enabled_for_user(conn, user_id)
        # Récupérer localisation user (via `get_user_location`)
        try:
            user_lat, user_lon = await get_user_location(conn, user_id)
        except Exception:
            return {"success": False, "detail": "Localisation non trouvée."}

        # Récupérer profil user (via `get_profile_by_user_id`)
        user_profile = await get_profile_by_user_id(user_id)
        gender, preferences, user_interests = (
            user_profile["gender"], 
            user_profile["sexual_preferences"], 
            user_profile["interests"]
        )

        # Récupérer profils likés (via `get_liked_user_ids`)
        liked_user_ids = await get_liked_user_ids(conn, user_id)

        # Récupérer profils selon préférences (via `get_matching_profiles`)
        profiles = await get_matching_profiles(conn, user_id, gender, preferences)

        # Enrichir les profils avec distance, âge, tags (via `enrich_profiles`)
        enriched_profiles = await enrich_profiles(
            user_lat, user_lon, user_interests, liked_user_ids, profiles, include_coords=map_enabled
        )

        for profile in enriched_profiles:
            print("profile:", profile["id"], "fame_rating =", profile.get("fame_rating"))

        # Filtrer selon critères fournis
        filtered_profiles = [
            profile for profile in enriched_profiles
            if (
                (minAge <= profile["age"] <= maxAge) and
                (minFame <= profile.get("fame_rating", 0) <= maxFame) and
                (maxDistance == "world" or (minDistance <= profile["distance_km"] <= int(maxDistance))) and
                (not filterByTags or profile["common_tags"] > 0)
            )
        ]
    async def is_not_blocked(profile):
        return not await are_users_blocked(user_id, profile["id"])

    not_blocked_profiles = [
        profile async for profile in async_generator_filter(filtered_profiles, is_not_blocked)
    ]
    # ajout des images de profile
    for profile in not_blocked_profiles:
        profile["main_picture"] = await get_main_picture_of_user(profile["id"])

    has_main_picture = bool(await get_main_picture_of_user(user_id))
    
    result = {
        "can_like": has_main_picture,
        "profiles": not_blocked_profiles,
    }

    if map_enabled:
        result["user_location"] = {
            "latitude": user_lat,
            "longitude": user_lon
        }

    return result

@router.post("/like")
async def like_profile(request: Request, data: dict):
    """Empêche de liker deux fois et crée une conversation en cas de match."""
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    liker_id = user["id"]
    liked_id = data.get("targetId")
    user_liked = await get_user_by_id(liked_id)

    if liker_id == liked_id:
        return {"success": False, "detail": "You cannot like yourself"}

    if await are_users_blocked(liker_id, liked_id):
        return {"matched": False}
    
    # Si un des deux utilisateurs a unliked l’autre → aucun effet
    if await check_if_unliked(liker_id, liked_id) or await check_if_unliked(liked_id, liker_id):
        return {"matched": False}

    # Vérifie que le liker a une photo
    main_pic = await get_main_picture_of_user(liker_id)
    if not main_pic:
        return {"success": False, "detail": "You must upload a profile picture before liking others."}

    # Vérifie si l'utilisateur a déjà liké
    if await check_same_like(liker_id, liked_id):
        return {"success": False, "detail": "You already liked this user"}

    # Insère le like
    await insert_like(liker_id, liked_id)

    await increment_fame_rating(liked_id, amount=3)

    # Vérifie si c'est un match
    if await check_match(liker_id, liked_id):
        # Crée la conversation
        await create_conversation(liker_id, liked_id)

        # Notifications croisées
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
        await increment_fame_rating(liker_id, amount=7)
        await increment_fame_rating(liked_id, amount=7)
        return {"success": True, "matched": True}

    # Notification pour un simple like (pas encore un match)
    await send_notification(
        receiver_id=liked_id,
        sender_id=liker_id,
        notification_type="like",
        context=f"{user['username']} a liké votre profil ❤️"
    )

    return {"success": True, "matched": False}

@router.post("/unlike")
async def unlike_user(request: Request, data: dict):
    """Permet de 'unlike' un utilisateur, empêche toute interaction future."""
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    liker_id = user["id"]
    liked_id = data.get("targetId")

    if liker_id == liked_id:
        return {"success": False, "detail": "You cannot unlike yourself"}

    updated = await set_unlike_status(liker_id, liked_id)
    if not updated:
        return {"success": False, "detail": "Cannot unlike this user"}

    return {"success": True, "message": "User unliked successfully"}