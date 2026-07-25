import os
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent

def _default_database_url() -> str:
    return os.getenv("DATABASE_URL", f"sqlite:///{(BASE_DIR / 'bionode.db').as_posix()}")


class Settings(BaseModel):
    app_name: str = Field(default="Bionode API")
    environment: str = Field(default=os.getenv("ENVIRONMENT", "development"))
    debug: bool = Field(default=os.getenv("DEBUG", "false").lower() == "true")

    database_url: str = Field(default=_default_database_url())
    redis_url: str = Field(default=os.getenv("REDIS_URL", "redis://localhost:6379/0"))

    danger_flood_threshold_cm: float = Field(default=float(os.getenv("DANGER_FLOOD_THRESHOLD_CM", "250.0")))
    hysteresis_reseal_cm: float = Field(default=float(os.getenv("HYSTERESIS_RESEAL_CM", "230.0")))
    pollution_rate_shift_threshold_pct: float = Field(default=float(os.getenv("POLLUTION_RATE_SHIFT_THRESHOLD_PCT", "5.0")))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
