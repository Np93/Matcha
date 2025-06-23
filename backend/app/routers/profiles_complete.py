from app.utils.jwt_handler import verify_user_from_token
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from app.utils.validators import validate_text_field
from app.profile.profile_service import upsert_profile
import logging
from datetime import datetime, date
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
    if isinstance(user_id, JSONResponse):
        return user_id
    # print("c'est pas le token tout bon")
    gender = body.get("gender")
    sexual_preferences = body.get("sexual_preferences")
    biography = body.get("biography", "")
    interests = body.get("interests", [])
    birthday = body.get("birthday")
    location = body.get("location", None)
    map_enabled = body.get("mapEnabled", False)
    print("localisation lors du profile complete ", location)

    if not sexual_preferences:
        sexual_preferences = "bisexual"
    # Validation sécurisée des champs
    error = validate_text_field(gender, "gender")
    if error:
        return error
    error = validate_text_field(sexual_preferences, "sexual preferences")
    allowed_genders = {"male", "female"}
    allowed_preferences = {"heterosexual", "homosexual", "bisexual"}

    if gender not in allowed_genders:
        return {"success": False, "detail": "Invalid gender. Only 'male' or 'female' are allowed."}

    if sexual_preferences not in allowed_preferences:
        return {"success": False, "detail": "Invalid sexual preference. Only 'heterosexual', 'homosexual' or 'bisexual' are allowed."}
    if error:
        return error
    if biography:
        error = validate_text_field(biography, "biography", regex=r"^[a-zA-Z0-9\s.,!?'-]+$")
        if error:
            return error
    if birthday:
        try:
            birth_dt = datetime.strptime(birthday, "%Y-%m-%d")
            birth_date = birth_dt.date()
        except ValueError:
            return {"success": False, "detail": "Invalid date format. Use YYYY-MM-DD."}

    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

    if age < 18:
        return {"success": False, "detail": "You must be at least 18 years old."}
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
            mapEnabled=location.get("mapEnabled"),  # Par défaut False si absent
        )

    return {
        "success": True,
        "id": user_id["id"],
        "message": "Profile completed successfully"
    }