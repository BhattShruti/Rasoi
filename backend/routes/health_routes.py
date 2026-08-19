import time
import platform
from datetime import datetime, timedelta
from flask import Blueprint, current_app
from config import Config
from utils.response import success_response

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health():
    """
    Get backend service health status
    ---
    tags:
      - Health
    responses:
      200:
        description: Service is healthy and configuration is valid.
        schema:
          type: object
          properties:
            status:
              type: string
              example: "healthy"
            service:
              type: string
              example: "Rasoi REST API"
            version:
              type: string
              example: "1.0.0"
            environment:
              type: string
              example: "development"
            python_version:
              type: string
              example: "3.10.0"
            uptime:
              type: string
              example: "0:12:34"
            timestamp:
              type: string
              example: "2026-08-02T13:05:00.123456Z"
            gemini_api:
              type: string
              example: "available"
    """
    # Calculate uptime
    uptime_seconds = time.time() - Config.START_TIME
    uptime_str = str(timedelta(seconds=int(uptime_seconds)))

    # Determine environment based on flask debug settings
    env = "development" if current_app.debug else "production"

    # Verify Gemini API key configuration status without calling the service
    gemini_status = "available" if Config.GEMINI_API_KEY else "unavailable"

    health_data = {
        "status": "healthy",
        "service": "Rasoi REST API",
        "version": "1.0.0",
        "environment": env,
        "python_version": platform.python_version(),
        "uptime": uptime_str,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "gemini_api": gemini_status
    }

    return success_response(health_data)
