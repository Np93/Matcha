from sqlalchemy import text
from fastapi import Request
from fastapi.responses import HTMLResponse
from app.utils.database import engine
from fastapi.responses import JSONResponse
from app.utils.jwt_handler import verify_user_from_token
from app.profile.picture_service import process_image, insert_picture, count_user_pictures
import httpx

MAX_PICTURES = 5

async def is_oauth_account_linked(email: str) -> bool:
    query = text("""
        SELECT oa.id
        FROM oauth_accounts oa
        JOIN users u ON oa.user_id = u.id
        WHERE u.email = :email AND oa.provider = 'google'
    """)
    async with engine.begin() as conn:
        result = await conn.execute(query, {"email": email})
        return result.first() is not None

async def link_oauth_account(user_id: int, google_id: str) -> None:
    """cree table oauth pour le user"""
    async with engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
            VALUES (:user_id, 'google', :provider_user_id)
            ON CONFLICT DO NOTHING
        """), {
            "user_id": user_id,
            "provider_user_id": google_id
        })

def google_popup_response(js_payload: dict) -> HTMLResponse:
    """
    Génère une réponse HTML qui envoie un message à la fenêtre parente (popup).
    """
    return HTMLResponse(content=f"""
        <html>
        <body>
            <script>
                window.opener.postMessage({json.dumps(js_payload)}, "*");
                window.close();
            </script>
        </body>
        </html>
    """, media_type="text/html")

async def handle_google_picture_upload(request: Request, user_data: dict):
    user = await verify_user_from_token(request)
    if isinstance(user, JSONResponse):
        return user
    email = user_data["email"]
    picture_url = user_data.get("picture")

    if not picture_url:
        return google_popup_response({
            "type": "google-picture-error",
            "success": False,
            "detail": "No profile picture found from Google"
        })

    user_id = user["id"]

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(picture_url)
            image_data = response.content

        compressed_data = process_image(image_data)

        if await count_user_pictures(user_id) >= MAX_PICTURES:
            return google_popup_response({
                "type": "google-picture-error",
                "success": False,
                "detail": "Maximum number of pictures reached"
            })

        await insert_picture(user_id, compressed_data)

    except Exception as e:
        print(f"[Google] Failed to fetch or insert image: {e}")
        return google_popup_response({
            "type": "google-picture-error",
            "success": False,
            "detail": "Failed to process Google image"
        })

    return HTMLResponse(content="""
        <html>
        <body>
            <script>
            window.opener.postMessage({ type: "google-picture-success" }, "*");
            window.close();
            </script>
        </body>
        </html>
    """)