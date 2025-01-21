from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.config import settings
from fastapi import Response, HTTPException, Request
from app.user_service import get_user_by_id

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "iat": now})  # Ajout d'expiration et de création
    print(f"print info de to_encode dans create_access_token: {to_encode}")
    encoded_jwt = jwt.encode(to_encode, settings.api_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

# Génère un access token (JWT court) et un refresh token (JWT long)
def create_tokens(user_id: int):
    access_token_expires = timedelta(minutes=15)  # Access token expire après 15 minutes
    refresh_token_expires = timedelta(days=7)  # Refresh token expire après 7 jours

    access_token = create_access_token(data={"sub": user_id}, expires_delta=access_token_expires)
    refresh_token = create_access_token(data={"sub": user_id}, expires_delta=refresh_token_expires)

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
        HTTPException: Si le token est manquant, invalide ou si l'utilisateur est déconnecté.
    """
    # Récupérer le token depuis les cookies
    token = request.cookies.get(token_key)
    if not token:
        raise HTTPException(status_code=401, detail=f"Missing {token_key}")

    try:
        # Décoder le token
        payload = jwt.decode(token, settings.api_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        # Vérifier si l'utilisateur est actif
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not user["status"]:
            raise HTTPException(status_code=401, detail="User is not online")

        # Retourner les informations utilisateur
        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
