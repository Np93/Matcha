from sqlalchemy.sql import text
from datetime import datetime
from app.utils.database import engine
from app.tables.locations import locations_table
import math

async def upsert_location(user_id: int, latitude: float, longitude: float, city: str, country: str, location_method: str, mapEnabled: bool):
    """Met à jour ou insère la localisation d'un utilisateur avec mapEnabled."""
    if mapEnabled is None:
        mapEnabled = False
    async with engine.begin() as conn:
        # Vérifier si l'utilisateur a déjà une localisation
        check_query = text("SELECT id FROM locations WHERE user_id = :user_id")
        result = await conn.execute(check_query, {"user_id": user_id})
        existing_location = result.fetchone()

        if existing_location:
            # Mise à jour de la localisation existante
            update_query = text("""
                UPDATE locations
                SET latitude = :latitude, 
                    longitude = :longitude, 
                    city = :city, 
                    country = :country, 
                    location_method = :location_method, 
                    map_enabled = :mapEnabled,
                    last_updated = :last_updated
                WHERE user_id = :user_id
            """)
            await conn.execute(update_query, {
                "user_id": user_id,
                "latitude": latitude,
                "longitude": longitude,
                "city": city,
                "country": country,
                "location_method": location_method,
                "mapEnabled": mapEnabled,
                "last_updated": datetime.utcnow(),
            })
        else:
            # Insertion d'une nouvelle localisation
            insert_query = text("""
                INSERT INTO locations (user_id, latitude, longitude, city, country, location_method, map_enabled, last_updated)
                VALUES (:user_id, :latitude, :longitude, :city, :country, :location_method, :mapEnabled, :last_updated)
            """)
            await conn.execute(insert_query, {
                "user_id": user_id,
                "latitude": latitude,
                "longitude": longitude,
                "city": city,
                "country": country,
                "location_method": location_method,
                "mapEnabled": mapEnabled,
                "last_updated": datetime.utcnow(),
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

async def update_location(conn, user_id: int, latitude: float, longitude: float, city: str, country: str, location_method: str, map_enabled: bool):
    """Met à jour la localisation d'un utilisateur dans la base de données."""
    query = text("""
        UPDATE locations 
        SET latitude = :latitude, 
            longitude = :longitude, 
            city = :city, 
            country = :country, 
            location_method = :location_method, 
            map_enabled = :map_enabled, 
            last_updated = :last_updated
        WHERE user_id = :user_id;
    """)
    
    await conn.execute(query, {
        "latitude": latitude,
        "longitude": longitude,
        "city": city,
        "country": country,
        "location_method": location_method,
        "map_enabled": map_enabled,
        "last_updated": datetime.utcnow(),
        "user_id": user_id
    })

async def get_all_inf_location_of_user(conn, user_id: int) -> dict | None:
    result = await conn.execute(
        text("""
            SELECT latitude, longitude, city, country, location_method
            FROM locations
            WHERE user_id = :user_id
            LIMIT 1;
        """),
        {"user_id": user_id}
    )
    row = result.mappings().first()

    if not row:
        return None

    return {
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "city": row["city"],
        "country": row["country"],
        "locationMethod": row["location_method"],
    }

async def is_map_enabled_for_user(conn, user_id: int) -> bool:
    """Retourne True si l'utilisateur a activé l'affichage de la carte."""
    query = text("""
        SELECT map_enabled 
        FROM locations 
        WHERE user_id = :user_id
    """)
    result = await conn.execute(query, {"user_id": user_id})
    row = result.fetchone()
    return row and row.map_enabled