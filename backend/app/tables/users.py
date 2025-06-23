from sqlalchemy import Table, Column, Integer, String, MetaData, DateTime, Boolean
from datetime import datetime
from sqlalchemy.sql import text
from sqlalchemy.dialects.postgresql import TIMESTAMP

metadata = MetaData()

# Table des utilisateurs
users_table = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True),
    Column("email", String, unique=True, nullable=False),
    Column("username", String, unique=True, nullable=False),
    Column("first_name", String, nullable=False),
    Column("last_name", String, nullable=False),
    Column("password_hash", String, nullable=True),
    Column("created_at", TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False),
    # Column("created_at", DateTime, default=datetime.utcnow, nullable=False),
    Column("status", Boolean, default=False, nullable=False),
    Column("laste_connexion", TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False),
    # Column("laste_connexion", DateTime, default=datetime.utcnow, nullable=False),
)