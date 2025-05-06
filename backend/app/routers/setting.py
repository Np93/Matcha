from fastapi import APIRouter, Depends, Request, HTTPException, UploadFile, File
from PIL import Image
from io import BytesIO
from app.utils.jwt_handler import verify_user_from_token
from app.utils.database import engine
from app.profile.location_service import update_location, get_all_inf_location_of_user
from app.profile.block_service import get_blocked_users, unblock_users
from app.profile.picture_service import count_user_pictures, insert_picture, get_pictures_of_user, delete_user_pictures_by_ids, set_main_picture

router = APIRouter()
MAX_PICTURES = 5
MAX_DIMENSION = 500

@router.get("/location")
async def get_user_location_route(request: Request):
    """Récupère la localisation actuelle de l'utilisateur"""
    user = await verify_user_from_token(request)
    user_id = user["id"]

    async with engine.begin() as conn:
        location = await get_all_inf_location_of_user(conn, user_id)

    if not location:
        raise HTTPException(status_code=404, detail="Localisation non trouvée")

    return location

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


@router.post("/upload_picture")
async def upload_profile_picture(request: Request, image: UploadFile = File(...)):
    user = await verify_user_from_token(request)
    user_id = user["id"]

    count = await count_user_pictures(user_id)
    if count >= MAX_PICTURES:
        raise HTTPException(status_code=400, detail="Maximum number of pictures reached")

    # Lire et convertir l'image
    content = await image.read()
    img = Image.open(BytesIO(content)).convert("RGB")
    
    # Redimensionnement proportionnel avec plus grand côté = 500 px
    original_width, original_height = img.size
    max_side = max(original_width, original_height)
    scale_factor = MAX_DIMENSION / max_side
    new_width = int(original_width * scale_factor)
    new_height = int(original_height * scale_factor)
    
    img = img.resize((new_width, new_height), Image.LANCZOS)

    # Compression JPEG
    output = BytesIO()
    img.save(output, format="JPEG", quality=80)
    compressed_data = output.getvalue()

    await insert_picture(user_id, compressed_data)

    return {"message": "Image uploaded successfully"}

@router.get("/get_pictures")
async def get_pictures(request: Request):
    user = await verify_user_from_token(request)
    return await get_pictures_of_user(user["id"])

@router.post("/delete_pictures")
async def delete_user_pictures(request: Request, body: dict):
    """Supprime les images sélectionnées par l'utilisateur"""
    user = await verify_user_from_token(request)
    user_id = user["id"]

    ids = body.get("ids")
    if not ids or not isinstance(ids, list):
        raise HTTPException(status_code=400, detail="No picture IDs provided")

    await delete_user_pictures_by_ids(user_id, ids)
    return {"message": "Pictures deleted successfully"}

@router.post("/set_main_picture")
async def set_main_profile_picture(request: Request, body: dict):
    """Définit une image comme photo de profil principale"""
    user = await verify_user_from_token(request)
    user_id = user["id"]
    picture_id = body.get("picture_id")

    if not picture_id:
        raise HTTPException(status_code=400, detail="picture_id is required")

    await set_main_picture(user_id, picture_id)
    return {"message": "Main profile picture updated successfully"}