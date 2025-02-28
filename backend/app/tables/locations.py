from sqlalchemy import Table, Column, Integer, Float, String, ForeignKey, DateTime, func, MetaData, Boolean

metadata = MetaData()

locations_table = Table(
    "locations", metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
    Column("latitude", Float, nullable=False),
    Column("longitude", Float, nullable=False),
    Column("city", String, nullable=True),
    Column("country", String, nullable=True),
    Column("location_method", String, nullable=False, default="IP"),
    Column("map_enabled", Boolean, default=False, nullable=False),
    Column("last_updated", DateTime, default=func.now(), onupdate=func.now())
)