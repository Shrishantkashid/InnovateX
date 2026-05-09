from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

class Database:
    client: AsyncIOMotorClient = None

db_instance = Database()

def get_db():
    if db_instance.client is None:
        db_instance.client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=2000,
        )
    return db_instance.client[settings.MONGO_DB_NAME]
