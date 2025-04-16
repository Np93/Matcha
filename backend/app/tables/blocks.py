from sqlalchemy import Table, Column, Integer, ForeignKey, MetaData, DateTime, func, UniqueConstraint

metadata = MetaData()

blocks_table = Table(
    "blocks", metadata,
    Column("id", Integer, primary_key=True),
    Column("blocker_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("blocked_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("created_at", DateTime, server_default=func.now(), nullable=False),
    UniqueConstraint("blocker_id", "blocked_id", name="uq_blocker_blocked")
)