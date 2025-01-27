from sqlalchemy import Table, Column, Integer, String, ForeignKey, MetaData, LargeBinary, Boolean
# from datetime import datetime

metadata = MetaData()

profile_pictures_table = Table(
    "profile_pictures", metadata,
    Column("id", Integer, primary_key=True),  # ID unique pour chaque image
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),  # Référence au profil
    Column("image_data", LargeBinary, nullable=False),  # Données binaires de l'image
    Column("is_profile_picture", Boolean, default=False, nullable=False),  # Indique si c'est la photo de profil
    # Column("created_at", DateTime, default=datetime.utcnow, nullable=False)  # Timestamp pour suivi
)