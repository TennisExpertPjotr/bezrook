import os


def loadenv(key: str):
    value = os.getenv(key)
    if value is None:
        raise ValueError(f"{key} must be set in environment!")
    return value


def loadsecret(key: str):
    try:
        with open(f'/run/secrets/{key}', 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        raise ValueError(f"{key} must be set in secrets!")


class Settings:
    POSTGRES_HOST = 'database'
    POSTGRES_PORT = '5432'
    POSTGRES_DB = loadenv("POSTGRES_DB")
    POSTGRES_USER = loadenv("POSTGRES_USER")
    POSTGRES_PASSWORD = loadsecret("db_password")
    JWT_SECRET_KEY = loadsecret("jwt_key")


settings = Settings()
