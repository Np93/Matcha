import json
from datetime import datetime
from sqlalchemy.sql import text
from app.utils.database import engine

async def upsert_profile(user_id: int, gender: str, sexual_preferences: str, biography: str, interests: list, birthday: str = None):
    """
    Ajoute ou met à jour un profil utilisateur avec une requête SQL.
    """
    # print("le user_id dans upsert_profile: ", user_id)
    birthday_date = datetime.strptime(birthday, "%Y-%m-%d").date() if birthday else None
    interests_json = json.dumps(interests)  # Convertit la liste en JSON

    query = text("""
    INSERT INTO profiles (user_id, gender, sexual_preferences, biography, interests, birthday, fame_rating)
    VALUES (:user_id, :gender, :sexual_preferences, :biography, :interests, :birthday, 0)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        gender = EXCLUDED.gender,
        sexual_preferences = EXCLUDED.sexual_preferences,
        biography = EXCLUDED.biography,
        interests = EXCLUDED.interests,
        birthday = EXCLUDED.birthday;
    """)

    async with engine.begin() as conn:
        await conn.execute(query, {
            "user_id": user_id,
            "gender": gender,
            "sexual_preferences": sexual_preferences,
            "biography": biography,
            "interests": interests_json,
            "birthday": birthday_date
        })

async def get_profile_by_user_id(id: int):
    """
    Récupère les informations de profil associées à un utilisateur donné avec une requête SQL.
    """
    # print("le user id dans get_profile_by_user_id: ", id)
    query = text("SELECT * FROM profiles WHERE user_id = :id LIMIT 1;")

    async with engine.begin() as conn:
        result = await conn.execute(query, {"id": id})
        profile_data = result.fetchone()  # Renvoie un tuple

    # print("ceci est les informations dans profile_data qui gère la db: ", profile_data)
    if not profile_data:
        return None

    # Transformation du tuple en dictionnaire en utilisant les noms de colonnes
    column_names = result.keys()  # Récupère les noms des colonnes
    profile_dict = dict(zip(column_names, profile_data))  # Convertit tuple -> dict

    return {
        "gender": profile_dict["gender"],
        "sexual_preferences": profile_dict["sexual_preferences"],
        "biography": profile_dict["biography"],
        "interests": profile_dict["interests"],  # Peut être en JSON
        "birthday": profile_dict["birthday"].strftime("%Y-%m-%d") if profile_dict["birthday"] else None,
        "fame_rating": profile_dict["fame_rating"]
    }

async def increment_fame_rating(user_id: int, amount: int = 1):
    """Incrémente le fame_rating d'un utilisateur, sans dépasser 50."""
    async with engine.begin() as conn:
        query = text("""
            UPDATE profiles
            SET fame_rating = LEAST(50, fame_rating + :amount)
            WHERE user_id = :user_id;
        """)
        await conn.execute(query, {
            "user_id": user_id,
            "amount": amount
        })

async def reset_fame_ratings():
    async with engine.begin() as conn:
        query = text("UPDATE profiles SET fame_rating = 0")
        await conn.execute(query)