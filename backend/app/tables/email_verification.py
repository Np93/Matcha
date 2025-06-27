from sqlalchemy import Table, Column, Integer, String, ForeignKey, DateTime, Boolean, MetaData, func

metadata = MetaData()

# Table pour la vérification des emails
email_verification_table = Table(
    "email_verification", metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("token", String(255), nullable=False),
    Column("created_at", DateTime, default=func.now(), nullable=False),
    Column("expires_at", DateTime, nullable=True),
    Column("is_verified", Boolean, default=False, nullable=False),
)

password_reset_table = Table(
    "password_reset", metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("code", String(8), nullable=False),
    Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
    Column("expires_at", DateTime(timezone=True), nullable=False),
)