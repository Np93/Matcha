from sqlalchemy import Table, Column, Integer, String, MetaData, DateTime, Boolean
from datetime import datetime

metadata = MetaData()

# Table des utilisateurs
users_table = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True),
    Column("email", String, unique=True, nullable=False),
    Column("password_hash", String, nullable=False),
    Column("created_at", DateTime, default=datetime.utcnow, nullable=False),
    Column("status", Boolean, default=False, nullable=False),
)