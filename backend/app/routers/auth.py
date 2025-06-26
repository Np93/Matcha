from app.utils.jwt_handler import create_tokens
from datetime import timedelta, datetime
from fastapi.responses import RedirectResponse
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Request, Response
from app.utils.validators import validate_email, validate_password
from app.user.user_service import add_user, hash_password, authenticate_user, get_user_by_email, update_user_status, get_user_by_username, authenticate_user_by_username, get_user_by_id
import logging
import re
from app.config import settings
from app.tables.oauth import oauth
from fastapi.responses import HTMLResponse
from app.email.email_service import send_verification_email, save_email_verification_token, get_verification_token_info, mark_email_verified, delete_email_verification_entry
from app.utils.jwt_handler import verify_user_from_token
from app.user.oauth_service import is_oauth_account_linked, link_oauth_account, handle_google_picture_upload

router = APIRouter()

# Logger pour déboguer
logger = logging.getLogger(__name__)

@router.post("/login")
async def login(request: Request, response: Response):
    # print("DEBUG: Received login request")  # Début de la requête
    body = await request.json()
    username = body.get("username")
    password = body.get("password")

    # print(f"DEBUG: Received email: {email}")  # Log de l'email reçu
    # print("DEBUG: Validating email and password format...")  # Étape de validation

    # Validation stricte des données
    if not username or not re.match(r"^[a-zA-Z0-9_.-]+$", username):
        print("ERROR: Invalid username format")  # Username invalide
        return {"success": False, "detail": "Invalid username format"}
    if not password or not validate_password(password):
        print("ERROR: Password does not meet security requirements")  # Password invalide
        return {"success": False, "detail": "Password does not meet security requirements"}

    # print("DEBUG: Validations passed. Authenticating user in the database...")  # Authentification

    # Authentifier l'utilisateur via la base de données
    auth_user = await authenticate_user_by_username(username, password)
    if not auth_user:
        if auth_user is None:
            return { "success": False, "detail": "This account was created with Google. Please log in using Google." }
        elif auth_user is False:
            return { "success": False, "detail": "Invalid credentials." }

    # # print(f"DEBUG: User {email} authenticated successfully. Generating JWT token...")  # Authentification réussie
    user = await get_user_by_username(username)
    # print(user)
    # Vérifier si l'utilisateur est déjà connecté
    # if user["status"]:  # Vérifie si le statut est déjà `True`
    #     return {"success": False, "detail": "User is already logged in"}

    await update_user_status(user["id"], True)
    # user = await get_user_by_email(email)

    # Création des tokens
    access_token, refresh_token = create_tokens(user["id"])

    # Définir un cookie sécurisé contenant le token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True, # True
        samesite="lax" # "Strict"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True, # True
        samesite="lax" # "Strict"
    )

    # print(f"DEBUG: Token generated and set in cookie for user: {email}")  # Log du token généré

    return {
        "success": True, 
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
        return {"success": False, "detail": "Invalid email format"}
    if not password or not validate_password(password):
        return {"success": False, "detail": "Password does not meet security requirements"}
    if not first_name or not re.match(r"^[a-zA-Z]+$", first_name):
        return {"success": False, "detail": "Invalid first name"}
    if not last_name or not re.match(r"^[a-zA-Z]+$", last_name):
        return {"success": False, "detail": "Invalid last name"}
    if not username or not re.match(r"^[a-zA-Z0-9_.-]+$", username):
        return {"success": False, "detail": "Invalid username"}

    # Vérifiez si l'utilisateur existe déjà
    existing_user = await get_user_by_email(email)
    existing_username = await get_user_by_username(username)
    if existing_user or existing_username:
        return {"success": False, "detail": "Email or username already exists"}

    # Hacher le mot de passe
    password_hash = await hash_password(password)

    # Ajouter l'utilisateur à la base de données
    await add_user(email, username, first_name, last_name, password_hash, email_verified=False)

    user = await get_user_by_email(email)

    # Création des tokens
    access_token, refresh_token = create_tokens(user["id"])

    expiration_time = await save_email_verification_token(email, access_token)
    print(f"✅ Token enregistré ! Expire à : {expiration_time}")
    email_sent = await send_verification_email(email, access_token)
    if not email_sent:
        return {"success": False, "detail": "Erreur lors de l'envoi de l'email de vérification."}

    # Définir un cookie sécurisé contenant le JWT
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True,
        secure=True, # True
        samesite="lax" # "Strict"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True, # True
        samesite="lax" # "Strict"
    )

    return {
        "success": True,
        "id": user["id"],
        "email_verified": False,
    }

@router.get("/email_status")
async def check_email_verification(request: Request):
    user = await verify_user_from_token(request)
    print(user)
    if isinstance(user, JSONResponse):
        return user

    user_data = await get_user_by_id(user["id"])
    return {
        "success": True,
        "id": user_data["id"],
        "email_verified": user_data["email_verified"]
    }

@router.get("/confirm_email/{token}")
async def confirm_email(token: str):
    """Confirme l'email (appel AJAX)"""
    try:
        user_id, expires_at = await get_verification_token_info(token)

        if datetime.utcnow() > expires_at:
            return {"success": False, "detail": "Token expiré."}

        await mark_email_verified(user_id)
        await delete_email_verification_entry(user_id)

        return {"success": True, "detail": "Email confirmé."}

    except Exception as e:
        return {"success": False, "detail": f" Erreur : {str(e)}"}

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
    redirect_uri = f"{origin}/auth/google/callback?action=picture"
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
        return {"success": False, "detail": "Invalid or missing action parameter"}

    if isinstance(user, dict) and not user.get("success", True):
        return user

    user_id = user["id"]

    # Prépare la réponse HTML à injecter dans la popup
    access_token, refresh_token = create_tokens(user_id)
    response_html = f"""
        <html>
          <body>
            <script>
                window.opener.postMessage({{
                    type: "google-auth-success",
                    success: true,
                    token: "{access_token}"
                }}, "*");
                window.close();
            </script>
          </body>
        </html>
    """

    response = HTMLResponse(content=response_html, media_type="text/html")

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

async def generate_unique_username(base_username: str) -> str:
    username = base_username
    suffix = 1
    while await get_user_by_username(username):
        username = f"{base_username}{suffix}"
        suffix += 1
    return username

async def handle_google_signup(email: str, first_name: str, last_name: str, username: str, google_id: str):
    existing_user = await get_user_by_email(email)
    if existing_user:
        return {"success": False, "detail": "User already exists"}

    if last_name == "Lastname":
        last_name = first_name
    if first_name:
        username = first_name

    base_username = re.sub(r"[^a-zA-Z0-9_.-]", "", first_name or "user")

    unique_username = await generate_unique_username(base_username)

    await add_user(
        email=email,
        username=unique_username,
        first_name=first_name,
        last_name=last_name,
        password_hash=None,
        email_verified=True
    )

    user = await get_user_by_email(email)
    await link_oauth_account(user["id"], google_id)

    return user

async def handle_google_login(email: str):
    user = await get_user_by_email(email)
    if not user:
        return {"success": False, "detail": "User does not exist"}
    if not await is_oauth_account_linked(email):
        return {"success": False, "detail": "Google account not linked"}
    if not user["status"]:
        await update_user_status(user["id"], True)
    return user

@router.get("/me")
async def get_current_user(request: Request):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    return {"id": user["id"]}