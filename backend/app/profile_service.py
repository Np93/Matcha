import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime
from app.tables.profile import profiles_table
from app.utils.database import async_session
from fastapi import HTTPException

async def upsert_profile(user_id: int, gender: str, sexual_preferences: str, biography: str, interests: list):
    """
    Ajoute ou met à jour un profil utilisateur.
    """
    async with async_session() as session:
        async with session.begin():
            print("le user_id dans upsert_profile: ", user_id)
            # Préparer la requête d'upsert
            query = insert(profiles_table).values(
                user_id=user_id,
                gender=gender,
                sexual_preferences=sexual_preferences,
                biography=biography,
                interests=json.dumps(interests)  # Convertit les tags en JSON
            ).on_conflict_do_update(
                index_elements=["user_id"],  # Mise à jour si le profil existe déjà
                set_={
                    "gender": gender,
                    "sexual_preferences": sexual_preferences,
                    "biography": biography,
                    "interests": json.dumps(interests)
                }
            )
            await session.execute(query)

async def get_profile_by_user_id(id: int):
    """
    Récupère les informations de profil associées à un utilisateur donné.

    :param id: ID de l'utilisateur
    :return: Dictionnaire contenant les informations de profil
    """
    async with async_session() as session:
        async with session.begin():
            print("le user id dans get_profile_by_user_id: ", id)
            # Requête pour récupérer les informations du profil
            query = await session.execute(
                select(profiles_table).where(profiles_table.c.id == id)
            )
            profile_data = query.mappings().first()
            # profile_data = query.fetchone()

            if not profile_data:
                raise HTTPException(status_code=404, detail="Profile not found")

            # Retourner les informations du profil sous forme de dictionnaire
            return {
                "gender": profile_data["gender"],
                "sexual_preferences": profile_data["sexual_preferences"],
                "biography": profile_data["biography"],
                "interests": profile_data["interests"],  # Peut être en JSON
            }