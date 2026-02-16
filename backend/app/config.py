from functools import lru_cache
from typing import Optional, Union, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    app_name: str = "FinSight AI"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str
    db_echo: bool = False
    
    # AI & LLM
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    google_api_key: Optional[str] = None
    google_model: str = "gemini-3-flash-preview"
    embedding_model: str = "text-embedding-3-small"
    
    # File Storage
    upload_dir: str = "/app/uploads"
    max_upload_size_mb: int = 50
    
    # Processing
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS - accepts comma-separated string or list
    cors_origins: Union[str, list[str]] = "http://localhost:3000"
    
    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(',')]
        elif isinstance(v, list):
            return v
        return [str(v)]
    
    @property
    def max_upload_size_bytes(self) -> int:
        """Convert MB to bytes."""
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
