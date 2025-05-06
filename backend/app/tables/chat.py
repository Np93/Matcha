from sqlalchemy import Table, Column, Integer, String, ForeignKey, MetaData, DateTime, Text, Boolean
from datetime import datetime
from sqlalchemy.sql import text
from sqlalchemy.dialects.postgresql import TIMESTAMP

metadata = MetaData()

conversations_table = Table(
    "conversations", metadata,
    Column("id", Integer, primary_key=True),
    Column("user1_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("user2_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    # Column("created_at", DateTime, default=datetime.utcnow, nullable=False),
    Column("created_at", TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False),
)

messages_table = Table(
    "messages", metadata,
    Column("id", Integer, primary_key=True),
    Column("conversation_id", Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
    Column("sender_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("content", Text, nullable=False),
    Column("timestamp", TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False),
    # Column("timestamp", DateTime, default=datetime.utcnow, nullable=False),
    Column("is_read", Boolean, default=False),
)