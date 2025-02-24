from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from app.utils.database import async_session
from app.tables.locations import locations_table
import math

async def upsert_location(user_id: int, latitude: float, longitude: float, city: str, country: str, location_method: str):
    """Met à jour ou insère la localisation d'un utilisateur."""
    async with async_session() as session:
        async with session.begin():
            # Vérifier si l'utilisateur a déjà une localisation
            check_query = text("SELECT id FROM locations WHERE user_id = :user_id")
            result = await session.execute(check_query, {"user_id": user_id})
            existing_location = result.fetchone()

            if existing_location:
                # Mise à jour de la localisation existante
                update_query = text("""
                    UPDATE locations
                    SET latitude = :latitude, longitude = :longitude, city = :city, country = :country, location_method = :location_method, last_updated = NOW()
                    WHERE user_id = :user_id
                """)
                await session.execute(update_query, {
                    "user_id": user_id,
                    "latitude": latitude,
                    "longitude": longitude,
                    "city": city,
                    "country": country,
                    "location_method": location_method
                })
            else:
                # Insertion d'une nouvelle localisation
                insert_query = text("""
                    INSERT INTO locations (user_id, latitude, longitude, city, country, location_method, last_updated)
                    VALUES (:user_id, :latitude, :longitude, :city, :country, :location_method, NOW())
                """)
                await session.execute(insert_query, {
                    "user_id": user_id,
                    "latitude": latitude,
                    "longitude": longitude,
                    "city": city,
                    "country": country,
                    "location_method": location_method
                })

def haversine(lat1, lon1, lat2, lon2):
    """Calcule la distance en kilomètres entre deux points GPS."""
    R = 6371  # Rayon de la Terre en km

    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c  # Distance en kilomètres

async def get_user_location(conn, user_id):
    """Récupère la localisation (latitude, longitude) d'un utilisateur."""
    query = text("""
        SELECT latitude, longitude 
        FROM locations 
        WHERE user_id = :user_id;
    """)
    result = await conn.execute(query, {"user_id": user_id})
    location = result.fetchone()
    if not location:
        raise Exception("Localisation non trouvée pour cet utilisateur.")
    return location