# Configuration for the application
import os
from datetime import timedelta


class Config:
    # Security settings
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    if not JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY is required")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    CORS_ORIGINS = [origin.strip() for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]

    # Database configuration
    DB_CONFIG = {
        "host": os.environ.get("DB_HOST", "localhost"),
        "port": int(os.environ.get("DB_PORT", 3306)),
        "user": os.environ.get("DB_USER", "root"),
        "password": os.environ.get("DB_PASSWORD", ""),
        "database": os.environ.get("DB_NAME", "carbon_footprint"),
        "auth_plugin": "caching_sha2_password",
    }

    # Application settings
    DEBUG = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    TESTING = False
