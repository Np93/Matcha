from sqlalchemy import Table, Column, Integer, ForeignKey, MetaData, DateTime, UniqueConstraint
from datetime import datetime

metadata = MetaData()

likes_table = Table(
    "likes", metadata,
    Column("id", Integer, primary_key=True),
    Column("liker_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("liked_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("created_at", DateTime, default=datetime.utcnow, nullable=False),
    UniqueConstraint("liker_id", "liked_id")  # Empêche les doublons
)