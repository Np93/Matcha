from app.utils.jwt_handler import create_tokens
from datetime import timedelta
from fastapi import APIRouter, HTTPException, Request, Response
from app.utils.validators import validate_email, validate_password
from app.user.user_service import add_user, hash_password, authenticate_user, get_user_by_email, update_user_status, get_user_by_username
import logging
import re
from app.config import settings
from app.tables.oauth import oauth
from fastapi.responses import HTMLResponse
from app.utils.jwt_handler import verify_user_from_token
from app.user.oauth_service import is_oauth_account_linked, link_oauth_account, handle_google_picture_upload

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
        secure=False, # True
        samesite="lax" # "Strict"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False, # True
        samesite="lax" # "Strict"
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
        secure=False, # True
        samesite="lax" # "Strict"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False, # True
        samesite="lax" # "Strict"
    )

    return {
        "id": user["id"],
    }

@router.get("/google/login")
async def login_with_google(request: Request):
    origin = settings.frontend_origin
    redirect_uri = f"{origin}/auth/google/callback?action=login"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/signup")
async def signup_with_google(request: Request):
    origin = settings.frontend_origin
    redirect_uri = f"{origin}/auth/google/callback?action=signup"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/picture")
async def login_with_google(request: Request):
    origin = settings.frontend_origin
    redirect_uri = f"{origin}auth/google/callback?action=picture"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request):
    action = request.query_params.get("action")
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.get("userinfo", token=token)
    user_data = user_info.json()

    google_id = user_data["id"]
    email = user_data["email"]
    first_name = user_data.get("given_name") or "Firstname"
    last_name = user_data.get("name") or "Lastname"
    picture_url = user_data.get("picture", "")
    username = f"google_{google_id[:8]}"

    if action == "signup":
        user = await handle_google_signup(email, first_name, last_name, username, google_id)

    elif action == "login":
        user = await handle_google_login(email)

    elif action == "picture":
        return await handle_google_picture_upload(request, user_data)

    else:
        raise HTTPException(status_code=400, detail="Invalid or missing action parameter")

    user_id = user["id"]

    # Prépare la réponse HTML à injecter dans la popup
    access_token, refresh_token = create_tokens(user_id)
    response_html = f"""
        <html>
          <body>
            <script>
                window.opener.postMessage({{
                    type: "google-auth-success",
                    token: "{access_token}"
                }}, "*");
                window.close();
            </script>
          </body>
        </html>
    """

    response = HTMLResponse(content=response_html)

    access_token, refresh_token = create_tokens(user_id)
    response.set_cookie(
        key="access_token", 
        value=access_token,
        httponly=True,
        secure=False,  # True en production
        samesite="lax"
    )
    response.set_cookie(
        key="refresh_token", 
        value=refresh_token,
        httponly=True,
        secure=False,  # True en production
        samesite="lax"
    )
    # return response
    return response

async def handle_google_signup(email: str, first_name: str, last_name: str, username: str, google_id: str):
    existing_user = await get_user_by_email(email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    if last_name == "Lastname":
        last_name = first_name
    if first_name:
        username = first_name

    await add_user(
        email=email,
        username=username,
        first_name=first_name,
        last_name=last_name,
        password_hash=None
    )

    user = await get_user_by_email(email)
    await link_oauth_account(user["id"], google_id)

    return user

async def handle_google_login(email: str):
    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User does not exist")
    if not await is_oauth_account_linked(email):
        raise HTTPException(status_code=403, detail="Google account not linked")
    if not user["status"]:
        await update_user_status(user["id"], True)
    return user

@router.get("/me")
async def get_current_user(request: Request):
    user = await verify_user_from_token(request)
    return {"id": user["id"]}