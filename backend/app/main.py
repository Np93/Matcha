from fastapi import FastAPI
from app.routers import example

app = FastAPI()

app.include_router(example.router)

@app.get("/")
async def root():
    return {"message": "Hello, Matcha!"}