from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    jwt_public_key_b64: str
    jwt_algorithm: str = "RS256"
    jwt_audience: str | None = None
    jwt_issuer: str | None = None
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "postgres"
    db_password: str = "postgres"
    db_name: str = "shop_db"

    class Config:
        env_file=".env"

settings = Settings()