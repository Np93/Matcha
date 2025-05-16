from sqlalchemy import Table, Column, Integer, ForeignKey, MetaData, String
from sqlalchemy.sql import text
from sqlalchemy.dialects.postgresql import TIMESTAMP

metadata = MetaData()

oauth_accounts = Table(
    "oauth_accounts", metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column("provider", String, nullable=False),
    Column("provider_user_id", String, nullable=False),
    Column("created_at", TIMESTAMP(timezone=True), server_default=text("NOW()"))
)