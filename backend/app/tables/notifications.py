from sqlalchemy import Table, Column, Integer, ForeignKey, String, DateTime, Boolean, MetaData
from datetime import datetime

metadata = MetaData()

notifications_table = Table(
    "notifications", metadata,
    Column("id", Integer, primary_key=True),
    Column("receiver_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),  # Destinataire de la notif
    Column("sender_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),  # Expéditeur de l'événement
    Column("type", String, nullable=False),  # "message", "like", "visit", "match"
    Column("context", String, nullable=True),  # Résumé de la notif (ex: "Alice vous a envoyé un message")
    Column("timestamp", DateTime, default=datetime.utcnow, nullable=False),
    Column("is_read", Boolean, default=False, nullable=False),  # False = non lue, True = lue
)