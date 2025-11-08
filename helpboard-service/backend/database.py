from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[DB_NAME]

users = db["Users"] 
helpboard_users = db["Helpboard_Users"]
helpboard_requests = db["Helpboard_Requests"]
helpboard_responses = db["Helpboard_Responses"]