from app.utils.jwt_handler import create_tokens
from datetime import timedelta
from fastapi import APIRouter, HTTPException, Request, Response
from app.utils.validators import validate_email, validate_password
from app.user.user_service import add_user, hash_password, authenticate_user, get_user_by_email, update_user_status, get_user_by_username
# from app.profile.profile_service import upsert_profile, get_profile_by_user_id
import logging
import re

router = APIRouter()

# Logger pour déboguer
logger = logging.getLogger(__name__)

@router.post("/login")
async def login(request: Request, response: Response):
    # print("DEBUG: Received login request")  # Début de la requête
    body = await request.json()
    email = body.get("email")
    password = body.get("password")

    # print(f"DEBUG: Received email: {email}")  # Log de l'email reçu
    # print("DEBUG: Validating email and password format...")  # Étape de validation

    # Validation stricte des données
    if not email or not validate_email(email):
        print("ERROR: Invalid email format")  # Email invalide
        raise HTTPException(status_code=400, detail="Invalid email format")
    if not password or not validate_password(password):
        print("ERROR: Password does not meet security requirements")  # Password invalide
        raise HTTPException(status_code=400, detail="Password does not meet security requirements")

    # print("DEBUG: Validations passed. Authenticating user in the database...")  # Authentification

    # Authentifier l'utilisateur via la base de données
    auth_user = await authenticate_user(email, password)
    if not auth_user:
        # print("ERROR: Invalid credentials")  # Erreur d'authentification
        raise HTTPException(status_code=401, detail="Invalid credentials")

    print(f"DEBUG: User {email} authenticated successfully. Generating JWT token...")  # Authentification réussie
    user = await get_user_by_email(email)
    print(user)
    # Vérifier si l'utilisateur est déjà connecté
    if user["status"]:  # Vérifie si le statut est déjà `True`
        raise HTTPException(status_code=403, detail="User is already logged in")

    await update_user_status(user["id"], True)
    # user = await get_user_by_email(email)

    # Création des tokens
    access_token, refresh_token = create_tokens(user["id"])

    # Définir un cookie sécurisé contenant le token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="Strict"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="Strict"
    )

    print(f"DEBUG: Token generated and set in cookie for user: {email}")  # Log du token généré

    return {
        "id": user["id"],
    }


@router.post("/signup")
async def signup(request: Request, response: Response):
    body = await request.json()
    email = body.get("email")
    password = body.get("password")
    first_name = body.get("first_name")
    last_name = body.get("last_name")
    username = body.get("username")

    # Validation stricte des données
    if not email or not validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if not password or not validate_password(password):
        raise HTTPException(status_code=400, detail="Password does not meet security requirements")
    if not first_name or not re.match(r"^[a-zA-Z]+$", first_name):
        raise HTTPException(status_code=400, detail="Invalid first name")
    if not last_name or not re.match(r"^[a-zA-Z]+$", last_name):
        raise HTTPException(status_code=400, detail="Invalid last name")
    if not username or not re.match(r"^[a-zA-Z0-9_.-]+$", username):
        raise HTTPException(status_code=400, detail="Invalid username")

    # Vérifiez si l'utilisateur existe déjà
    existing_user = await get_user_by_email(email)
    existing_username = await get_user_by_username(username)
    if existing_user or existing_username:
        raise HTTPException(status_code=400, detail="Email or username already exists")

    # Hacher le mot de passe
    password_hash = await hash_password(password)

    # Ajouter l'utilisateur à la base de données
    await add_user(email, username, first_name, last_name, password_hash)

    user = await get_user_by_email(email)

    # Création des tokens
    access_token, refresh_token = create_tokens(user["id"])

    # Définir un cookie sécurisé contenant le JWT
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, 
        secure=True, 
        samesite="Strict"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="Strict"
    )

    return {
        "id": user["id"],
    }