from fastapi import APIRouter, HTTPException, Request
from app.utils.jwt_handler import verify_user_from_token
from app.utils.database import async_session, engine
from app.chat.chat_service import create_conversation
from app.match.match_service import check_same_like, insert_like, check_match, get_liked_user_ids, get_matching_profiles, enrich_profiles, sort_profiles
from app.user.user_service import get_user_by_id
from app.profile.block_service import are_users_blocked, async_generator_filter
from app.profile.location_service import haversine, get_user_location
from app.routers.notifications import send_notification
from app.profile.profile_service import get_profile_by_user_id, increment_fame_rating
from app.profile.picture_service import get_main_picture_of_user
from sqlalchemy.sql import text
import json

router = APIRouter()

@router.get("/profiles")
async def get_profiles(request: Request):
    """Récupère les profils selon les préférences avec enrichissement."""
    user = await verify_user_from_token(request)
    user_id = user["id"]

    async with engine.begin() as conn:
        # Récupérer localisation user (via `locations_service`)
        try:
            user_lat, user_lon = await get_user_location(conn, user_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Localisation non trouvée.")

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
            user_lat, user_lon, user_interests, liked_user_ids, profiles
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
    return {
        "can_like": has_main_picture,
        "profiles": sorted_profiles
    }
    # Trier les profils selon distance > tags > fame rating
    # sorted_profiles = await sort_profiles(profiles_with_details)

    # return sorted_profiles

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
    minFame = int(query_params.get("minFame", 1))
    maxFame = int(query_params.get("maxFame", 5))
    filterByTags = query_params.get("filterByTags", "false").lower() == "true"
   
    #Vérifier l'utilisateur connecté
    user = await verify_user_from_token(request)
    user_id = user["id"]

    async with engine.begin() as conn:
        # Récupérer localisation user (via `get_user_location`)
        try:
            user_lat, user_lon = await get_user_location(conn, user_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Localisation non trouvée.")

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
            user_lat, user_lon, user_interests, liked_user_ids, profiles
        )

        # Filtrer selon critères fournis
        filtered_profiles = [
            profile for profile in enriched_profiles
            if (
                (minAge <= profile["age"] <= maxAge) and
                # (minFame <= profile.get("fame_rating", 0) <= maxFame) and
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
    return {
        "can_like": has_main_picture,
        "profiles": not_blocked_profiles
    }
    # return filtered_profiles

@router.post("/like")
async def like_profile(request: Request, data: dict):
    """Empêche de liker deux fois et crée une conversation en cas de match."""
    user = await verify_user_from_token(request)
    liker_id = user["id"]
    liked_id = data.get("targetId")
    user_liked = await get_user_by_id(liked_id)

    if liker_id == liked_id:
        raise HTTPException(status_code=400, detail="You cannot like yourself")

    if await are_users_blocked(liker_id, liked_id):
        return {"matched": False}

    # Vérifie que le liker a une photo
    main_pic = await get_main_picture_of_user(liker_id)
    if not main_pic:
        raise HTTPException(status_code=403, detail="You must upload a profile picture before liking others.")

    # Vérifie si l'utilisateur a déjà liké
    if await check_same_like(liker_id, liked_id):
        raise HTTPException(status_code=400, detail="You already liked this user")

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
        return {"matched": True}

    return {"matched": False}