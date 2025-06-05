from sqlalchemy.sql import text
from datetime import datetime
from app.utils.database import engine
from app.profile.location_service import haversine

async def check_same_like(liker_id: int, liked_id: int):
    """Vérifie si un like identique existe."""
    async with engine.begin() as conn:
        result = await conn.execute(
            text("""
                SELECT 1 FROM likes
                WHERE liker_id = :liker_id AND liked_id = :liked_id
                LIMIT 1;
            """),
            {"liker_id": liker_id, "liked_id": liked_id}
        )
        return result.first()

async def insert_like(liker_id: int, liked_id: int):
    """Insère un like si inexistant."""
    async with engine.begin() as conn:
        await conn.execute(
            text("""
                INSERT INTO likes (liker_id, liked_id, created_at)
                VALUES (:liker_id, :liked_id, NOW())
                ON CONFLICT DO NOTHING;
            """),
            {"liker_id": liker_id, "liked_id": liked_id}
        )

async def check_match(liker_id: int, liked_id: int):
    """Vérifie s'il y a un match (like inverse)."""
    async with engine.begin() as conn:
        result = await conn.execute(
            text("""
                SELECT 1 FROM likes
                WHERE liker_id = :liked_id AND liked_id = :liker_id
                LIMIT 1;
            """),
            {"liked_id": liked_id, "liker_id": liker_id}
        )
        return result.first()

async def check_if_unliked(liker_id: int, liked_id: int) -> bool:
    query = text("""
        SELECT unlike
        FROM likes
        WHERE liker_id = :liker_id AND liked_id = :liked_id
        LIMIT 1
    """)
    
    async with engine.begin() as conn:
        result = await conn.execute(query, {"liker_id": liker_id, "liked_id": liked_id})
        row = result.fetchone()
        if row:
            return row.unlike
        return False  # Aucun like trouvé = pas unliked

async def set_unlike_status(liker_id: int, liked_id: int) -> bool:
    async with engine.begin() as conn:
        # Vérifier si la ligne existe déjà et si "unlike" est déjà True
        result = await conn.execute(
            text("""
                SELECT unlike FROM likes
                WHERE liker_id = :liker_id AND liked_id = :liked_id
            """),
            {"liker_id": liker_id, "liked_id": liked_id}
        )
        row = result.first()
        if not row:
            return False  # Aucune ligne à modifier
        if row.unlike:
            return False  # Déjà à True, rien à faire

        # Mettre à jour le champ unlike à TRUE
        await conn.execute(
            text("""
                UPDATE likes
                SET unlike = TRUE
                WHERE liker_id = :liker_id AND liked_id = :liked_id
            """),
            {"liker_id": liker_id, "liked_id": liked_id}
        )
        return True

async def get_liked_user_ids(conn, user_id):
    """Récupère les utilisateurs déjà likés par l'utilisateur."""
    query = text("""
        SELECT liked_id
        FROM likes
        WHERE liker_id = :user_id;
    """)
    result = await conn.execute(query, {"user_id": user_id})
    return {row[0] for row in result.fetchall()}

async def get_matching_profiles(conn, user_id, gender, preferences):
    """Récupère les profils selon les préférences sexuelles."""
    orientation_filter = get_orientation_filter(gender, preferences)
    query = text(f"""
        SELECT users.id, users.username, profiles.gender, profiles.sexual_preferences,
               profiles.birthday, profiles.interests, profiles.fame_rating, 
               locations.latitude, locations.longitude
        FROM users
        JOIN profiles ON users.id = profiles.user_id
        JOIN locations ON users.id = locations.user_id
        WHERE users.id != :user_id
          AND {orientation_filter};
    """)
    result = await conn.execute(query, {"user_id": user_id})
    return result.mappings().all()

def get_orientation_filter(user_gender: str, user_pref: str) -> str:
    """
    Retourne une clause SQL pour filtrer les profils en fonction
    du genre et des préférences sexuelles du user.
    """
    if user_pref == "heterosexual":
        # Cherche uniquement le sexe opposé, qui soit hétéro ou bi
        target_gender = "female" if user_gender == "male" else "male"
        return f"profiles.gender = '{target_gender}' AND profiles.sexual_preferences IN ('heterosexual', 'bisexual')"

    elif user_pref == "homosexual":
        # Cherche le même genre, qui soit homo ou bi
        return f"profiles.gender = '{user_gender}' AND profiles.sexual_preferences IN ('homosexual', 'bisexual')"

    elif user_pref == "bisexual":
        # Cherche :
        # - le même genre avec orientation bi ou homo
        # - le sexe opposé avec orientation bi ou hétéro
        same_gender = user_gender
        opposite_gender = "male" if user_gender == "female" else "female"
        return (
            f"((profiles.gender = '{same_gender}' AND profiles.sexual_preferences IN ('homosexual', 'bisexual')) "
            f"OR (profiles.gender = '{opposite_gender}' AND profiles.sexual_preferences IN ('heterosexual', 'bisexual')))"
        )

    # Par défaut (au cas où), ne filtre rien
    return "TRUE"

def calculate_age(birthday):
    """Calcule l'âge à partir de la date de naissance."""
    today = datetime.today()
    return today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))

def count_common_tags(user_tags, profile_tags):
    """Compte le nombre de tags communs."""
    user_set = set(tag.strip().lower() for tag in user_tags.split(",")) if user_tags else set()
    profile_set = set(tag.strip().lower() for tag in profile_tags.split(",")) if profile_tags else set()
    return len(user_set.intersection(profile_set))

async def enrich_profiles(user_lat, user_lon, user_interests, liked_user_ids, profiles, include_coords=False):
    """Ajoute distance, âge et nombre de tags communs à chaque profil."""
    profiles_with_details = []
    for profile in profiles:
        distance_km = None
        if profile["latitude"] is not None and profile["longitude"] is not None:
            distance_km = round(
                haversine(user_lat, user_lon, profile["latitude"], profile["longitude"])
            )

        age = calculate_age(profile["birthday"]) if profile["birthday"] else None
        common_tags = count_common_tags(user_interests, profile["interests"])
        fame_rating = profile.get("fame_rating", 0)  # Si non défini, valeur par défaut 0

        enriched = {
            "id": profile["id"],
            "username": profile["username"],
            "distance_km": distance_km,
            "liked": profile["id"] in liked_user_ids,
            "age": age,
            "common_tags": common_tags,
            "fame_rating": fame_rating  # Ajout du fame_rating pour le tri
        }

        if include_coords:
            enriched["latitude"] = profile["latitude"]
            enriched["longitude"] = profile["longitude"]

        profiles_with_details.append(enriched)

    return profiles_with_details

async def sort_profiles(profiles: list[dict]) -> list[dict]:
    """
    Trie les profils par :
    1. Distance (croissante)
    2. Nombre de tags communs (décroissant)
    3. Fame rating (décroissant)
    """
    return sorted(profiles, key=lambda p: (p["distance_km"], -p["common_tags"], -p["fame_rating"]))