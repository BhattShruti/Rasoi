import os
import time
from pathlib import Path
from dotenv import load_dotenv

# Load env variables relative to this file
dotenv_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=dotenv_path, override=True)

class Config:
    """Configuration class for the Flask application."""
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    PORT = int(os.getenv("PORT", 5000))
    HOST = os.getenv("HOST", "0.0.0.0")
    DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t", "yes", "y")
    LOG_DIR = Path(__file__).parent / "logs"
    
    # Store server start time for uptime statistics
    START_TIME = time.time()

    @classmethod
    def validate(cls):
        """Validate critical configuration parameters."""
        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set. Please set it in your .env file.")
