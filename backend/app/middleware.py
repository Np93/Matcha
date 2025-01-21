from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.config import settings
from app.user_service import get_user_by_email

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def verify_access_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.api_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        print(f"print de l'id du user dans verify_access_token: {user_id}")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Vérifiez si l'utilisateur est connecté
        user = await get_user_by_id(user_id)
        if not user or not user["status"]:
            raise HTTPException(status_code=401, detail="User not authenticated or logged out")
        
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# from jose import jwt, JWTError
# from fastapi import Depends, HTTPException
# from fastapi.security import OAuth2PasswordBearer
# from app.config import settings

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")  # Déclaration de l'URL de login

# def verify_access_token(token: str = Depends(oauth2_scheme)):
#     try:
#         payload = jwt.decode(token, settings.api_secret, algorithms=[settings.jwt_algorithm])
#         return payload
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Invalid or expired token")