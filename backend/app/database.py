from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME",   "projet_etudiants")

client: AsyncIOMotorClient = None


async def connect_db():
    """Called at app startup — opens the MongoDB connection."""
    global client
    from app.models.models import User, Project, Task, Message, Notification
    client = AsyncIOMotorClient(MONGO_URL)
    await init_beanie(
        database=client[DB_NAME],
        document_models=[User, Project, Task, Message, Notification],
    )
    print(f"✅ MongoDB connecté : {MONGO_URL}/{DB_NAME}")


async def close_db():
    """Called at app shutdown — closes the connection."""
    global client
    if client:
        client.close()
        print("🔌 MongoDB déconnecté")
