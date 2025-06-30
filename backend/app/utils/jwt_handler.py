from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.config import settings
from fastapi import Response, Request
from fastapi.responses import JSONResponse
from app.user.user_service import get_user_by_id

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "iat": now})  # Ajout d'expiration et de création
    to_encode.update({
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp())
    })
    encoded_jwt = jwt.encode(to_encode, settings.api_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def create_email_verification_token(user_id: int, email: str, expires_delta: timedelta = timedelta(minutes=10)) -> str:
    now = datetime.utcnow()
    expire = now + expires_delta
    payload = {
        "sub": "email_verification",
        "user_id": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }
    return jwt.encode(payload, settings.api_secret, algorithm=settings.jwt_algorithm)

# Génère un access token (JWT court) et un refresh token (JWT long)
def create_tokens(user_id: int):
    access_token_expires = timedelta(minutes=15)  # Access token expire après 15 minutes
    refresh_token_expires = timedelta(days=7)  # Refresh token expire après 7 jours

    access_token = create_access_token(data={"sub": str(user_id)}, expires_delta=access_token_expires)
    refresh_token = create_access_token(data={"sub": str(user_id)}, expires_delta=refresh_token_expires)

    return access_token, refresh_token

async def verify_user_from_token(request: Request, token_key: str = "access_token"):
    """
    Vérifie et décode le JWT, et valide que l'utilisateur est en ligne.

    Args:
        request (Request): La requête FastAPI contenant les cookies.
        token_key (str): Clé du cookie contenant le token à vérifier (par défaut: "access_token").

    Returns:
        dict: Les informations utilisateur si tout est valide.

    Raises:
        JSONResponse: Si le token est manquant, invalide ou si l'utilisateur est déconnecté.
    """
    # Récupérer le token depuis les cookies
    token = request.cookies.get(token_key)
    print(token)
    if not token:
        return JSONResponse(status_code=401, content={"success": False, "detail": f"Missing {token_key}"})

    try:
        # Décoder le token
        print(f"Token reçu : {token}")
        payload = jwt.decode(token, settings.api_secret, algorithms=[settings.jwt_algorithm])
    
        user_id = payload.get("sub")
        if not user_id:
            return JSONResponse(status_code=401, content={"success": False, "detail": "Invalid token payload"})

        # Vérifier si l'utilisateur est actif
        user = await get_user_by_id(user_id)

        if not user:
            return JSONResponse(status_code=404, content={"success": False, "detail": "User not found"})
        if not user["status"]:
            return JSONResponse(status_code=401, content={"success": False, "detail": "User is not online"})
        # Retourner les informations utilisateur
        return user
    
    except JWTError:
        return JSONResponse(status_code=401, content={"success": False, "detail": "Invalid or expired token"})

async def verify_user_from_socket_token(token):
    try:
        print("token dans sockey_tocken", token)
        payload = jwt.decode(token, settings.api_secret, algorithms=[settings.jwt_algorithm])
        
        user_id = payload.get("sub")
        if not user_id:
                return JSONResponse(status_code=401, content={"success": False, "detail": "Invalid token payload"})
        user = await get_user_by_id(user_id)
        if not user:
            return JSONResponse(status_code=404, content={"success": False, "detail": "User not found"})
        if not user["status"]:
            return JSONResponse(status_code=401, content={"success": False, "detail": "User is not online"})
        return user

    except JWTError:
        return JSONResponse(status_code=401, content={"success": False, "detail": "Invalid or expired token"})