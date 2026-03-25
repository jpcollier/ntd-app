from pydantic_settings import BaseSettings
from functools import lru_cache
import json


class Settings(BaseSettings):
    database_url: str  # Required — no default; must be set via DATABASE_URL env var
    backend_cors_origins: str = '["http://localhost:3000"]'

    @property
    def cors_origins(self) -> list[str]:
        return json.loads(self.backend_cors_origins)

    @property
    def sqlalchemy_database_url(self) -> str:
        # Fly.io sets DATABASE_URL with postgres:// but SQLAlchemy 2.x requires postgresql://
        return self.database_url.replace("postgres://", "postgresql://", 1)

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
