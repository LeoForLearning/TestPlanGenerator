from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    PROJECT_NAME = "TestPlanGenerator API"
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ENV = os.getenv("ENV", "development")

settings = Settings()
