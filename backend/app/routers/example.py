from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session

router = APIRouter()

@router.get("/example")
async def example_route(session: AsyncSession = Depends(get_session)):
    result = await session.execute("SELECT 'Hello, SQLAlchemy!'")
    return {"message": result.scalar_one()}