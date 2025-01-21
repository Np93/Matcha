from app.utils.jwt_handler import create_tokens, verify_user_from_token
from datetime import timedelta
from fastapi import APIRouter, HTTPException, Request, Response
from app.utils.validators import validate_email, validate_password
from app.user_service import add_user, hash_password, authenticate_user, get_user_by_email, update_user_status
import logging

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
    user = await authenticate_user(email, password)
    if not user:
        # print("ERROR: Invalid credentials")  # Erreur d'authentification
        raise HTTPException(status_code=401, detail="Invalid credentials")

    print(f"DEBUG: User {email} authenticated successfully. Generating JWT token...")  # Authentification réussie
    
    await update_user_status(email, True)
    user = await get_user_by_email(email)

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

    return {"message": "Login successful"}


@router.post("/signup")
async def signup(request: Request, response: Response):
    body = await request.json()
    email = body.get("email")
    password = body.get("password")

    # Validation stricte des données
    if not email or not validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if not password or not validate_password(password):
        raise HTTPException(status_code=400, detail="Password does not meet security requirements")

    # Vérifiez si l'utilisateur existe déjà
    existing_user = await get_user_by_email(email)
    print(existing_user)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # Hacher le mot de passe
    password_hash = await hash_password(password)

    # Ajouter l'utilisateur à la base de données
    await add_user(email, password_hash)

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

    return {"message": "Signup successful"}

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    try:
        payload = jwt.decode(refresh_token, settings.api_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")

        # Vérification que l'utilisateur est actif
        user = await get_user_by_id(user_id)
        if not user or not user["status"]:
            raise HTTPException(status_code=401, detail="User not authenticated")

        # Générer un nouveau access token
        access_token, _ = create_tokens(user_id)

        # Mettre à jour le cookie d'access token
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="Strict"
        )

        return {"message": "Access token refreshed"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.get("/profile")
async def get_profile(request: Request):
    user = await verify_user_from_token(request)  # Vérifie l'access token

    # Retourner les informations utilisateur
    return {
        "message": "All is OK",
        "user": {
            "id": user["id"],
            "created_at": user["created_at"],
        },
    }