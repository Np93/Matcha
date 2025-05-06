from sqlalchemy import Table, Column, Integer, ForeignKey, MetaData, DateTime, func, UniqueConstraint
from sqlalchemy.sql import text
from sqlalchemy.dialects.postgresql import TIMESTAMP

metadata = MetaData()

blocks_table = Table(
    "blocks", metadata,
    Column("id", Integer, primary_key=True),
    Column("blocker_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("blocked_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    # Column("created_at", DateTime, server_default=func.now(), nullable=False),
    Column("created_at", TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False),
    UniqueConstraint("blocker_id", "blocked_id", name="uq_blocker_blocked")
)