from fastapi import APIRouter, Depends, Request
from sqlalchemy.sql import text
from app.utils.database import async_session, engine
from app.utils.jwt_handler import verify_user_from_token

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

# @router.post("/settings/location/update")
# async def update_user_location(request: Request, new_location: dict):
#     """Met à jour la localisation selon ville et pays"""
#     user = await verify_user_from_token(request)
#     user_id = user["id"]

#     async with async_session() as session:
#         query = text("""
#             UPDATE locations 
#             SET latitude = :latitude, longitude = :longitude, city = :city, country = :country, last_updated = NOW() 
#             WHERE user_id = :user_id;
#         """)
#         await session.execute(query, {
#             "latitude": new_location["latitude"],
#             "longitude": new_location["longitude"],
#             "city": new_location["city"],
#             "country": new_location["country"],
#             "user_id": user_id
#         })
#         await session.commit()

#     return {"message": "Location updated successfully"}