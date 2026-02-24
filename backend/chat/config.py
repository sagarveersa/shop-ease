from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    jwt_public_key_b64: str
    jwt_algorithm: str = "RS256"
    jwt_audience: str | None = None
    jwt_issuer: str | None = None

    class Config:
        env_file=".env"

settings = Settings()