from app.utils.jwt_handler import create_tokens, verify_user_from_token
from datetime import timedelta
from fastapi import APIRouter, HTTPException, Request, Response
from app.user.user_service import update_user_status
import logging
import re

router = APIRouter()

# Logger pour déboguer
logger = logging.getLogger(__name__)

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    print("refresh")
    user = await verify_user_from_token(request, token_key="refresh_token")  # Vérifie le refresh token

    # Générer un nouveau access token
    access_token, _ = create_tokens(user["id"])

    # Mettre à jour le cookie d'access token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="Strict"
    )

    return {"message": "Access token refreshed"}

@router.get("/status")
async def get_status(request: Request):
    print("status")
    user = await verify_user_from_token(request)  # Vérifie l'access token

    # Retourner les informations utilisateur
    return {
        "id": user["id"],
    }

@router.post("/logout")
async def logout(request: Request, response: Response):
    user_id = request.headers.get("X-User-ID")
    print(user_id)
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user ID in headers")
    user = await verify_user_from_token(request)
    if str(user["id"]) != user_id:
        raise HTTPException(status_code=403, detail="User ID does not match authenticated user")
    await update_user_status(user["id"], False)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}