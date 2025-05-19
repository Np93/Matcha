from app.utils.database import engine
from sqlalchemy.sql import text
import base64
from PIL import Image
from io import BytesIO

MAX_DIMENSION = 500

async def get_pictures_of_user(user_id: int):
    """
    Récupère toutes les images de profil (ID et données binaires) d'un utilisateur.
    """
    async with engine.begin() as conn:
        query = text("""
            SELECT id, image_data, is_profile_picture
            FROM profile_pictures
            WHERE user_id = :user_id
            ORDER BY is_profile_picture DESC, id ASC
        """)
        result = await conn.execute(query, {"user_id": user_id})
        pictures = result.mappings().all()

    return [
        {
            "id": pic["id"],
            "image_data": base64.b64encode(pic["image_data"]).decode("utf-8"),
            "is_profile_picture": pic["is_profile_picture"]
        }
        for pic in pictures
    ]

async def count_user_pictures(user_id: int) -> int:
    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT COUNT(*) FROM profile_pictures WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        return result.scalar()

async def insert_picture(user_id: int, image_data: bytes):
    async with engine.begin() as conn:
        await conn.execute(
            text("""
                INSERT INTO profile_pictures (user_id, image_data, is_profile_picture)
                VALUES (:user_id, :image_data, FALSE)
            """),
            {"user_id": user_id, "image_data": image_data}
        )
        await ensure_main_picture(conn, user_id)

async def delete_user_pictures_by_ids(user_id: int, ids: list[int]):
    """Supprime les images d'un utilisateur par ID, si elles lui appartiennent."""
    async with engine.begin() as conn:
        await conn.execute(
            text("""
                DELETE FROM profile_pictures
                WHERE user_id = :user_id AND id = ANY(:ids)
            """),
            {"user_id": user_id, "ids": ids}
        )
        await ensure_main_picture(conn, user_id)

async def set_main_picture(user_id: int, picture_id: int):
    """Définit une image comme principale et retire le flag des autres"""
    async with engine.begin() as conn:
        # Vérifier que la photo appartient bien à l'utilisateur
        result = await conn.execute(
            text("SELECT id FROM profile_pictures WHERE id = :id AND user_id = :user_id"),
            {"id": picture_id, "user_id": user_id}
        )
        if result.fetchone() is None:
            raise HTTPException(status_code=403, detail="Picture not found or unauthorized")

        # Mise à jour : une seule photo principale
        await conn.execute(
            text("""
                UPDATE profile_pictures
                SET is_profile_picture = CASE
                    WHEN id = :id THEN TRUE
                    ELSE FALSE
                END
                WHERE user_id = :user_id
            """),
            {"id": picture_id, "user_id": user_id}
        )

async def ensure_main_picture(conn, user_id: int):
    result = await conn.execute(
        text("""
            SELECT id FROM profile_pictures
            WHERE user_id = :user_id AND is_profile_picture = TRUE
            LIMIT 1
        """),
        {"user_id": user_id}
    )
    if result.fetchone():
        return

    result = await conn.execute(
        text("""
            SELECT id FROM profile_pictures
            WHERE user_id = :user_id
            ORDER BY id ASC
            LIMIT 1
        """),
        {"user_id": user_id}
    )
    new_main = result.fetchone()
    if new_main:
        await conn.execute(
            text("""
                UPDATE profile_pictures
                SET is_profile_picture = TRUE
                WHERE id = :id
            """),
            {"id": new_main[0]}
        )

async def get_main_picture_of_user(user_id: int) -> str | None:
    """Récupère l'image principale (base64) d’un utilisateur, ou None."""
    async with engine.begin() as conn:
        query = text("""
            SELECT image_data FROM profile_pictures
            WHERE user_id = :user_id AND is_profile_picture = TRUE
            LIMIT 1
        """)
        result = await conn.execute(query, {"user_id": user_id})
        row = result.fetchone()

    if row:
        return base64.b64encode(row[0]).decode("utf-8")
    return None

def process_image(image_bytes: bytes) -> bytes:
    img = Image.open(BytesIO(image_bytes)).convert("RGB")

    # Redimensionnement proportionnel
    original_width, original_height = img.size
    max_side = max(original_width, original_height)
    scale_factor = MAX_DIMENSION / max_side
    new_width = int(original_width * scale_factor)
    new_height = int(original_height * scale_factor)
    img = img.resize((new_width, new_height), Image.LANCZOS)

    # Compression JPEG
    output = BytesIO()
    img.save(output, format="JPEG", quality=80)
    return output.getvalue()