from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.sql import text
from app.utils.database import async_session, engine
from app.utils.jwt_handler import verify_user_from_token
from app.profile.location_service import update_location
from app.profile.block_service import get_blocked_users, unblock_users

router = APIRouter()

@router.get("/location")
async def get_user_location(request: Request):
    """Récupère la localisation actuelle de l'utilisateur"""
    user = await verify_user_from_token(request)
    user_id = user["id"]

    async with async_session() as session:
        query = text("SELECT latitude, longitude, city, country, location_method FROM locations WHERE user_id = :user_id LIMIT 1;")
        result = await session.execute(query, {"user_id": user_id})
        location = result.fetchone()

    if not location:
        raise HTTPException(status_code=404, detail="Localisation non trouvée")

    return {
        "latitude": location[0],
        "longitude": location[1],
        "city": location[2],
        "country": location[3],
        "locationMethod": location[4]
    }

@router.post("/location/update")
async def update_user_location(request: Request, new_location: dict):
    """Met à jour la localisation d'un utilisateur avec locationMethod et mapEnabled"""
    user = await verify_user_from_token(request)
    user_id = user["id"]

    # Vérifier que toutes les données nécessaires sont bien présentes
    required_fields = ["latitude", "longitude", "city", "country", "locationMethod", "mapEnabled"]
    for field in required_fields:
        if field not in new_location:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")

    async with engine.begin() as conn:
        await update_location(
            conn=conn,
            user_id=user_id,
            latitude=new_location["latitude"],
            longitude=new_location["longitude"],
            city=new_location["city"],
            country=new_location["country"],
            location_method=new_location["locationMethod"],
            map_enabled=new_location["mapEnabled"]
        )

    return {"message": "Location updated successfully"}

@router.get("/blocked")
async def get_blocked_profiles(request: Request):
    user = await verify_user_from_token(request)
    blocked_users = await get_blocked_users(user["id"])
    return {"blocked_users": blocked_users}

@router.post("/unblock")
async def unblock_profiles(request: Request, data: dict):
    user = await verify_user_from_token(request)
    blocked_ids = data.get("targetIds")

    if not blocked_ids or not isinstance(blocked_ids, list):
        raise HTTPException(status_code=400, detail="blockedIds must be a non-empty list")

    await unblock_users(user["id"], blocked_ids)
    return {"message": "Users unblocked successfully"}