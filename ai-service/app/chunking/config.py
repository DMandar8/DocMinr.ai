from pydantic_settings import BaseSettings
from typing import List

class ChunkingConfig(BaseSettings):
    """Configuration for document chunking"""
    
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    SEPARATORS: List[str] = ["\n\n", "\n", ". ", " ", ""]
    MIN_CHUNK_SIZE: int = 50
    
    class Config:
        env_prefix = "CHUNK_"
        env_file = ".env"

config = ChunkingConfig()