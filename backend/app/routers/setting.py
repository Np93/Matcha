from fastapi import APIRouter, Depends, Request, UploadFile, File
from app.utils.jwt_handler import verify_user_from_token
from app.utils.database import engine
from fastapi.responses import JSONResponse
from app.profile.location_service import update_location, get_all_inf_location_of_user
from app.profile.block_service import get_blocked_users, unblock_users
from app.profile.picture_service import count_user_pictures, insert_picture, get_pictures_of_user, delete_user_pictures_by_ids, set_main_picture, process_image

router = APIRouter()
MAX_PICTURES = 5

@router.get("/location")
async def get_user_location_route(request: Request):
    """Récupère la localisation actuelle de l'utilisateur"""
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    user_id = user["id"]

    async with engine.begin() as conn:
        location = await get_all_inf_location_of_user(conn, user_id)

    if not location:
        return {"success": False, "detail": "Localisation non trouvée"}

    return location

@router.post("/location/update")
async def update_user_location(request: Request, new_location: dict):
    """Met à jour la localisation d'un utilisateur avec locationMethod et mapEnabled"""
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    user_id = user["id"]

    # Vérifier que toutes les données nécessaires sont bien présentes
    required_fields = ["latitude", "longitude", "city", "country", "locationMethod", "mapEnabled"]
    for field in required_fields:
        if field not in new_location:
            return {"success": False, "detail": f"Missing field: {field}"}

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

    return {"success": True, "message": "Location updated successfully"}

@router.get("/blocked")
async def get_blocked_profiles(request: Request):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    blocked_users = await get_blocked_users(user["id"])
    return {"success": True, "blocked_users": blocked_users}

@router.post("/unblock")
async def unblock_profiles(request: Request, data: dict):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    blocked_ids = data.get("targetIds")

    if not blocked_ids or not isinstance(blocked_ids, list):
        return {"success": False, "detail": "blockedIds must be a non-empty list"}

    await unblock_users(user["id"], blocked_ids)
    return {"success": True, "message": "Users unblocked successfully"}

@router.post("/upload_picture")
async def upload_profile_picture(request: Request, image: UploadFile = File(...)):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    user_id = user["id"]

    count = await count_user_pictures(user_id)
    if count >= MAX_PICTURES:
        return {"success": False, "detail": "Maximum number of pictures reached"}

    content = await image.read()
    compressed_data = process_image(content)
    await insert_picture(user_id, compressed_data)

    return {"success": True, "message": "Image uploaded successfully"}

@router.get("/get_pictures")
async def get_pictures(request: Request):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    return await get_pictures_of_user(user["id"])

@router.post("/delete_pictures")
async def delete_user_pictures(request: Request, body: dict):
    """Supprime les images sélectionnées par l'utilisateur"""
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    user_id = user["id"]

    ids = body.get("ids")
    if not ids or not isinstance(ids, list):
        return {"success": False, "detail": "No picture IDs provided"}

    await delete_user_pictures_by_ids(user_id, ids)
    return {"success": True, "message": "Pictures deleted successfully"}

@router.post("/set_main_picture")
async def set_main_profile_picture(request: Request, body: dict):
    """Définit une image comme photo de profil principale"""
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    user_id = user["id"]
    picture_id = body.get("picture_id")

    if not picture_id:
        return {"success": False, "detail": "picture_id is required"}

    result = await set_main_picture(user_id, picture_id)

    return result