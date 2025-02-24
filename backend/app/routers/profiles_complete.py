from app.utils.jwt_handler import verify_user_from_token
from fastapi import APIRouter, HTTPException, Request, Response
from app.utils.validators import validate_text_field
from app.profile.profile_service import upsert_profile
import logging
from datetime import datetime
import re
from app.profile.location_service import upsert_location

router = APIRouter()

# Logger pour déboguer
logger = logging.getLogger(__name__)

@router.post("/")
async def complete_profile(request: Request):
    # print("je suis dans profile complete")
    body = await request.json()

    user_id = await verify_user_from_token(request)  # Vérifie l'utilisateur
    # print("c'est pas le token tout bon")
    gender = body.get("gender")
    sexual_preferences = body.get("sexual_preferences")
    biography = body.get("biography", "")
    interests = body.get("interests", [])
    birthday = body.get("birthday")
    location = body.get("location", None)

    # Validation sécurisée des champs
    validate_text_field(gender, "gender")
    validate_text_field(sexual_preferences, "sexual preferences")
    if biography:
        validate_text_field(biography, "biography", regex=r"^[a-zA-Z0-9\s.,!?'-]+$")
    if birthday:
        try:
            datetime.strptime(birthday, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    # print("user : ", user_id["id"])
    # Mise à jour ou insertion du profil
    await upsert_profile(user_id['id'], gender, sexual_preferences, biography, interests, birthday)

    if location:
        await upsert_location(
            user_id["id"],
            latitude=location.get("latitude"),
            longitude=location.get("longitude"),
            city=location.get("city"),
            country=location.get("country"),
            location_method=location.get("locationMethod"),
        )

    return {"id": user_id["id"]}