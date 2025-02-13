from app.utils.jwt_handler import create_tokens, verify_user_from_token
from datetime import timedelta, datetime
from fastapi import APIRouter, HTTPException, Request, Response
from app.user.user_service import update_user_status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from app.utils.database import engine 

import logging
import re
import os
import aiosmtplib
import asyncio
import asyncpg

from email.message import EmailMessage
from dotenv import load_dotenv
from app.config import settings

router = APIRouter()

load_dotenv()
#url=settings.react_app_api_url

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "matcha.ft42@gmail.com"
SMTP_PASSWORD = os.getenv("EMAIL_PASSWORD_GOOGLE")

# ici pas besoin de route
async def send_verification_email(user_email: str, token: str):
    confirm_url = f"http://localhost:8000/email/confirm_email/{token}"

    msg = EmailMessage()
    msg["From"] = SMTP_USERNAME
    msg["To"] = user_email
    msg["Subject"] = "Confirmez votre email"
    msg.set_content(f"Bonjour,\n\nCliquez sur ce lien pour vérifier votre email : {confirm_url}\n\nMerci !")

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_SERVER,
            port=SMTP_PORT,
            username=SMTP_USERNAME,
            password=SMTP_PASSWORD,
            use_tls=False,
            start_tls=True
        )
        print(f"✅ Email envoyé à {user_email}")
        return True
    except Exception as e:
        print(f"❌ Erreur d'envoi : {e}")
        return False




@router.get("/confirm_email/{token}")
async def confirm_email(token: str):
    """Confirme l'email en vérifiant le token et met à jour la base de données."""
    try:
        async with engine.begin() as conn:
            # 🔍 Vérifier si le token existe et n'a pas expiré
            query = text("SELECT user_id, expires_at FROM email_verification WHERE token = :token;")
            result = await conn.execute(query, {"token": token})
            row = result.fetchone()  # Pas besoin de await ici

            if not row:
                raise HTTPException(status_code=400, detail="❌ Lien de confirmation invalide.")

            # Accès au tuple avec les indices
            user_id, expires_at = row[0], row[1]

            # ⏳ Vérifier si le token a expiré
            if datetime.utcnow() > expires_at:
                raise HTTPException(status_code=400, detail="⏳ Le lien de confirmation a expiré.")

            # ✅ Mettre à jour le statut email_verified dans users
            update_query = text("UPDATE users SET email_verified = TRUE WHERE id = :user_id;")
            await conn.execute(update_query, {"user_id": user_id})

            # 🗑️ Supprimer l'entrée email_verification
            delete_query = text("DELETE FROM email_verification WHERE user_id = :user_id;")
            await conn.execute(delete_query, {"user_id": user_id})

        return {"message": "✅ Votre email a été confirmé avec succès !"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"🔥 Erreur lors de la confirmation : {str(e)}")




async def save_email_verification_token(email: str, token: str):
    """Crée un enregistrement dans la table email_verification"""
    create_at = datetime.utcnow()
    expires_at = create_at + timedelta(minutes=15)
    is_verified = False

    async with engine.begin() as conn:
        # 🔍 Trouver l'user_id à partir de l'email
        user_query = text("SELECT id FROM users WHERE email = :email;")
        result = await conn.execute(user_query, {"email": email})
        user = result.fetchone()
        
        if not user:
            raise ValueError("❌ Aucun utilisateur trouvé avec cet email.")

        user_id = user[0]  # SQLAlchemy retourne une ligne sous forme de tuple

        # ✅ Insérer dans la table email_verification
        insert_query = text("""
        INSERT INTO email_verification (user_id, token, created_at, expires_at, is_verified)
        VALUES (:user_id, :token, :created_at, :expires_at, :is_verified);
        """)

        await conn.execute(insert_query, {
            "user_id": user_id,
            "token": token,
            "created_at": create_at,
            "expires_at": expires_at,
            "is_verified": is_verified
        })

    return expires_at  # Retourne la date d'expiration
