import re
from fastapi import HTTPException

def validate_email(email: str) -> bool:
    """
    Vérifie si l'email est valide.
    - Doit contenir un '@' et un domaine valide.
    - Pas de caractères suspects (injection).
    """
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_regex, email):
        return False
    return True

def validate_password(password: str) -> bool:
    """
    Vérifie si le mot de passe est sécurisé.
    - Doit avoir au moins 8 caractères.
    - Doit contenir au moins une lettre majuscule, une lettre minuscule, et un chiffre.
    - Pas de caractères suspects ou espaces.
    """
    if len(password) < 8:
        return False
    if not any(char.islower() for char in password):
        return False
    if not any(char.isupper() for char in password):
        return False
    if not any(char.isdigit() for char in password):
        return False
    if any(char.isspace() for char in password):
        return False
    if len(password) > 20:
        return False
    return True

def validate_text_field(value: str, field_name: str, regex: str = r"^[a-zA-Z\s]+$"):
    """
    Valide un champ texte en vérifiant qu'il respecte un motif regex.
    """
    if not value or not re.match(regex, value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")