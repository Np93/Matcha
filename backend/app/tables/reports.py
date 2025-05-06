from sqlalchemy import Table, Column, Integer, ForeignKey, DateTime, func, UniqueConstraint, Index, MetaData

metadata = MetaData()

reports_table = Table(
    "reports", metadata,
    Column("id", Integer, primary_key=True),
    Column("reporter_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("reported_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("created_at", DateTime, server_default=func.now(), nullable=False),
    UniqueConstraint("reporter_id", "reported_id", name="uq_reporter_reported"),
    Index("idx_reported_id", "reported_id")
)