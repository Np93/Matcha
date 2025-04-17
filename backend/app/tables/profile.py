from sqlalchemy import Table, Column, Integer, String, ForeignKey, MetaData, Date

metadata = MetaData()

profiles_table = Table(
    "profiles", metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
    Column("gender", String, nullable=True),
    Column("sexual_preferences", String, nullable=True),
    Column("biography", String, nullable=True),
    Column("interests", String, nullable=True),  # Stockez les tags sous forme de chaîne JSON
    Column("birthday", Date, nullable=True),
    Column("fame_rating", Integer, nullable=False, default=0),
    # Column("profile_pictures", String, nullable=True),  # Stockez les chemins des images
)