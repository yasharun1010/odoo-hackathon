import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///expense.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    EXCHANGE_RATE_BASE_URL = os.getenv(
        "EXCHANGE_RATE_BASE_URL", "https://api.exchangerate-api.com/v4/latest"
    )
    EXCHANGE_RATE_CACHE_TTL_SECONDS = int(
        os.getenv("EXCHANGE_RATE_CACHE_TTL_SECONDS", "600")
    )
