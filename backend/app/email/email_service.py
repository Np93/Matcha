# from app.utils.jwt_handler import create_tokens, verify_user_from_token
from datetime import timedelta, datetime
from fastapi import APIRouter, HTTPException, Request, Response
# from app.user.user_service import update_user_status
# from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from app.utils.database import engine 
from app.config import settings
from fastapi.responses import RedirectResponse

import aiosmtplib
# import asyncio

from email.message import EmailMessage

SMTP_SERVER = settings.email_server
SMTP_PORT = 587
SMTP_USERNAME = settings.email
SMTP_PASSWORD = settings.email_password_google

async def send_email(to: str, subject: str, text_content: str, html_content: str = None) -> bool:
    msg = EmailMessage()
    msg["From"] = SMTP_USERNAME
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text_content)

    if html_content:
        msg.add_alternative(html_content, subtype="html")

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
        print(f"✅ Email envoyé à {to}")
        return True
    except Exception as e:
        print(f"❌ Erreur d'envoi à {to} : {e}")
        return False

async def send_verification_email(user_email: str, token: str) -> bool:
    confirm_url = f"https://localhost/email-confirm-link?token={token}"
    html_content = build_verification_email_html(token)
    text_content = f"Bienvenue sur Matcha ! Clique ici pour confirmer ton email : {confirm_url}"

    return await send_email(
        to=user_email,
        subject="Bienvenue sur Matcha – Confirme ton email",
        text_content=text_content,
        html_content=html_content
    )

async def send_reset_email(email: str, code: str) -> bool:
    text_content = f"Ton code de réinitialisation est : {code} (valable 10 min)"
    html_content = build_reset_email_html(code)

    return await send_email(
        to=email,
        subject="Réinitialisation de mot de passe – Matcha",
        text_content=text_content,
        html_content=html_content
    )

async def get_verification_token_info(token: str):
    query = text("SELECT user_id, expires_at FROM email_verification WHERE token = :token;")
    async with engine.begin() as conn:
        result = await conn.execute(query, {"token": token})
        row = result.fetchone()
    return row  # Peut être None

async def mark_email_verified(user_id: int):
    query = text("UPDATE users SET email_verified = TRUE WHERE id = :user_id;")
    async with engine.begin() as conn:
        await conn.execute(query, {"user_id": user_id})

async def delete_email_verification_entry(user_id: int):
    query = text("DELETE FROM email_verification WHERE user_id = :user_id;")
    async with engine.begin() as conn:
        await conn.execute(query, {"user_id": user_id})

async def save_email_verification_token(email: str, token: str):
    """Crée un enregistrement dans la table email_verification"""
    create_at = datetime.utcnow()
    expires_at = create_at + timedelta(minutes=2)
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

# Enregistre un nouveau code de reset
async def save_reset_code(user_id: int, code: str, expires_at: datetime):
    async with engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO password_reset (user_id, code, created_at, expires_at)
            VALUES (:user_id, :code, NOW(), :expires_at)
        """), {"user_id": user_id, "code": code, "expires_at": expires_at})

# Supprime tous les anciens codes pour un utilisateur
async def delete_reset_codes(user_id: int):
    async with engine.begin() as conn:
        await conn.execute(text("""
            DELETE FROM password_reset WHERE user_id = :user_id
        """), {"user_id": user_id})

# Récupère le dernier code envoyé (pour anti-spam)
async def get_last_reset_code_time(user_id: int):
    async with engine.begin() as conn:
        result = await conn.execute(text("""
            SELECT created_at FROM password_reset
            WHERE user_id = :user_id
            ORDER BY created_at DESC LIMIT 1
        """), {"user_id": user_id})
        row = result.fetchone()
    return row[0] if row else None

# Vérifie si un code est encore valide
async def verify_reset_code(user_id: int, code: str):
    async with engine.begin() as conn:
        result = await conn.execute(text("""
            SELECT id FROM password_reset
            WHERE user_id = :user_id AND code = :code AND expires_at > NOW()
            ORDER BY created_at DESC LIMIT 1
        """), {"user_id": user_id, "code": code})
        row = result.fetchone()
    return bool(row)

def build_verification_email_html(token: str) -> str:
    confirm_url = f"https://localhost/email-confirm-link?token={token}"
    return f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <h1 style="text-align: center; color: #e63946;">Bienvenue sur Matcha ❤️</h1>

          <p>Salut à toi, nouvel aventurier romantique,</p>

          <p>
            Que tu sois ici pour chercher l’âme sœur, faire de belles rencontres ou juste flirter en toute liberté,
            <strong>Matcha est là pour pimenter ta vie</strong> 💫 !
          </p>

          <p>
            Pour commencer cette fabuleuse aventure, il te reste une petite étape (promis, pas de dragon à affronter) :
          </p>

          <p style="text-align: center;">
            <a href="{confirm_url}" style="display: inline-block; padding: 12px 25px; background-color: #e63946; color: white; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
              ✅ Je confirme mon email
            </a>
          </p>

          <p style="margin-top: 20px;">
            📌 Une fois que tu as cliqué, une petite fenêtre s'ouvrira (magique ✨). Dès que l'email est confirmé, elle se refermera toute seule.
          </p>

          <p>
            🔁 Retourne ensuite simplement sur l’onglet où tu t’étais inscrit(e), et hop, l'aventure continue.
          </p>

          <p>
            😱 Tu as fermé la page par accident ? Pas de panique ! Reconnecte-toi et tu reprendras exactement là où tu t'étais arrêté(e).
          </p>

          <hr style="margin: 30px 0;" />

          <p style="text-align: center; font-size: 14px; color: #888;">
            À très vite sur Matcha ! 🍵<br />
            L’équipe Matcha – Ton cup de thé préféré.
          </p>
        </div>
      </body>
    </html>
    """

def build_reset_email_html(code: str) -> str:
    return f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
          <h2 style="color: #e63946;">Réinitialisation de mot de passe</h2>
          <p style="font-size: 16px; color: #333;">
            Voici ton code de sécurité :
          </p>
          <div style="font-size: 32px; font-weight: bold; margin: 20px 0; background-color: #fce8e6; color: #e63946; padding: 10px 20px; border-radius: 8px; display: inline-block;">
            {code}
          </div>
          <p style="color: #555; font-size: 14px;">
            Ce code est valide pendant <strong>10 minutes</strong>.<br/>
            Si tu n'as pas demandé de réinitialisation, ignore simplement cet email.
          </p>
          <p style="margin-top: 30px; font-size: 13px; color: #999;">
            L’équipe Matcha ❤️
          </p>
        </div>
      </body>
    </html>
    """