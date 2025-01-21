from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.utils.tables import metadata
from dotenv import load_dotenv
import os

load_dotenv()

def build_database_url():
    user = os.getenv("POSTGRES_USER")
    password = os.getenv("POSTGRES_PASSWORD")
    host = os.getenv("POSTGRES_HOST")
    port = os.getenv("POSTGRES_PORT")
    db_name = os.getenv("POSTGRES_DB")

    if not all([user, password, host, port, db_name]):
        raise ValueError("Missing one or more environment variables for the database connection.")

    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db_name}"

DATABASE_URL = build_database_url()

# Crée un moteur asynchrone
engine = create_async_engine(DATABASE_URL, echo=True)

# Crée une session asynchrone
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)