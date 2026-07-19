"""
Configuration for AI Service
Production-grade settings with Pydantic
"""
from typing import Optional, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

class Settings(BaseSettings):
    """
    Application settings with validation.
    Environment variables take precedence over defaults.
    """
    
    # ============================================
    # Server Configuration
    # ============================================
    APP_NAME: str = Field(
        default="DocMinr.ai AI Service",
        description="Name of the application"
    )
    APP_VERSION: str = Field(
        default="v1",
        description="API version"
    )
    HOST: str = Field(
        default="0.0.0.0",
        description="Host to bind to"
    )
    PORT: int = Field(
        default=8001,
        ge=1,
        le=65535,
        description="Port to listen on"
    )
    ENVIRONMENT: str = Field(
        default="development",
        pattern="^(development|staging|production)$",
        description="Environment name"
    )
    
    # ============================================
    # Debug Mode (Proper Boolean Handling)
    # ============================================
    DEBUG: bool = Field(
        default=True,
        description="Enable debug mode"
    )
    
    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        """Handle various boolean string formats"""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ("true", "1", "yes", "on", "enabled")
        return bool(value)
    
    # ============================================
    # Backend API
    # ============================================
    BACKEND_API_URL: str = Field(
        default="http://backend:8000",
        description="URL of the backend API"
    )
    BACKEND_API_TIMEOUT: int = Field(
        default=30,
        ge=1,
        le=120,
        description="Timeout in seconds for backend API calls"
    )
    
    # ============================================
    # Model Configuration
    # ============================================
    EMBEDDING_MODEL: str = Field(
        default="all-MiniLM-L6-v2",
        description="Sentence transformer model for embeddings"
    )
    EMBEDDING_DIMENSIONS: int = Field(
        default=384,
        description="Dimension of embedding vectors"
    )
    EMBEDDING_BATCH_SIZE: int = Field(
        default=32,
        ge=1,
        le=256,
        description="Batch size for embedding generation"
    )
    
    # ============================================
    # Chunking Configuration
    # ============================================
    CHUNK_SIZE: int = Field(
        default=500,
        ge=50,
        le=2000,
        description="Size of each chunk in characters"
    )
    CHUNK_OVERLAP: int = Field(
        default=50,
        ge=0,
        le=200,
        description="Overlap between chunks"
    )
    CHUNK_SEPARATORS: List[str] = Field(
        default=["\n\n", "\n", ". ", " ", ""],
        description="Separators for recursive chunking"
    )
    
    # ============================================
    # Qdrant Configuration
    # ============================================
    QDRANT_HOST: str = Field(
        default="qdrant",
        description="Qdrant hostname"
    )
    QDRANT_PORT: int = Field(
        default=6333,
        ge=1,
        le=65535,
        description="Qdrant port"
    )
    QDRANT_COLLECTION: str = Field(
        default="docminr_docs",
        description="Qdrant collection name"
    )
    QDRANT_REPLICATION: int = Field(
        default=1,
        ge=1,
        le=3,
        description="Qdrant replication factor"
    )
    
    # ============================================
    # MongoDB (for memory/checkpoints)
    # ============================================
    MONGODB_URI: str = Field(
        default="mongodb://mongodb:27017",
        description="MongoDB connection URI"
    )
    MONGODB_DATABASE: str = Field(
        default="docminr",
        description="MongoDB database name"
    )
    MONGODB_COLLECTION_CHECKPOINTS: str = Field(
        default="checkpoints",
        description="Collection for LangGraph checkpoints"
    )
    MONGODB_COLLECTION_MEMORY: str = Field(
        default="conversation_memory",
        description="Collection for conversation memory"
    )
    
    # ============================================
    # LLM Configuration
    # ============================================
    OLLAMA_URL: str = Field(
        default="http://ollama:11434",
        description="Ollama API URL"
    )
    OLLAMA_MODEL: str = Field(
        default="llama2:7b",
        description="Ollama model to use"
    )
    LLM_TEMPERATURE: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Temperature for LLM generation"
    )
    LLM_MAX_TOKENS: int = Field(
        default=2048,
        ge=1,
        le=4096,
        description="Maximum tokens for LLM response"
    )
    
    # ============================================
    # Retrieval Configuration
    # ============================================
    DEFAULT_TOP_K: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Default number of chunks to retrieve"
    )
    SIMILARITY_THRESHOLD: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score threshold"
    )
    
    # ============================================
    # Storage Paths
    # ============================================
    STORAGE_PATH: str = Field(
        default="/app/storage",
        description="Base path for file storage"
    )
    TEMP_PATH: str = Field(
        default="/app/temp",
        description="Base path for temporary files"
    )
    
    # ============================================
    # Security
    # ============================================
    JWT_SECRET: Optional[str] = Field(
        default=None,
        description="JWT secret for verifying tokens from backend"
    )
    
    # ============================================
    # Logging
    # ============================================
    LOG_LEVEL: str = Field(
        default="INFO",
        pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$",
        description="Logging level"
    )
    # ============================================
    # Embedding Configuration
    # ============================================
    EMBEDDING_MODEL: str = Field(
        default="BAAI/bge-base-en-v1.5",
        description="Embedding model to use"
    )
    EMBEDDING_DIMENSION: int = Field(
        default=768,
        description="Dimension of embedding vectors"
    )
    EMBEDDING_BATCH_SIZE: int = Field(
        default=32,
        ge=1,
        le=128,
        description="Batch size for embedding generation"
    )
    EMBEDDING_DEVICE: str = Field(
        default="cpu",
        description="Device to run embeddings on (cpu/cuda/mps)"
    )
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.ENVIRONMENT == "development"
    
    @property
    def qdrant_url(self) -> str:
        """Get full Qdrant URL"""
        return f"http://{self.QDRANT_HOST}:{self.QDRANT_PORT}"
    
    @property
    def storage_kb_path(self) -> str:
        """Get knowledge base storage path"""
        return os.path.join(self.STORAGE_PATH, "knowledge-bases")
    
    class Config:
        # Pydantic v2 configuration
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"
        
        # This enables loading from environment variables
        # with prefix (e.g., AI_SERVICE_PORT instead of PORT)
        env_prefix = ""
        
        # For nested configs
        env_nested_delimiter = "__"

# ============================================
# Create Settings Instance with Error Handling
# ============================================
def load_settings() -> Settings:
    """Load settings with graceful error handling"""
    try:
        return Settings()
    except Exception as e:
        print(f"⚠️ Error loading settings: {e}")
        print("⚠️ Falling back to default settings")
        # Return with defaults
        return Settings()

settings = load_settings()

# ============================================
# Log Configuration (for debugging)
# ============================================
if settings.DEBUG:
    print("📋 AI Service Configuration:")
    print(f"   APP_NAME: {settings.APP_NAME}")
    print(f"   ENVIRONMENT: {settings.ENVIRONMENT}")
    print(f"   PORT: {settings.PORT}")
    print(f"   DEBUG: {settings.DEBUG}")
    print(f"   BACKEND_API_URL: {settings.BACKEND_API_URL}")
    print(f"   EMBEDDING_MODEL: {settings.EMBEDDING_MODEL}")
    print(f"   CHUNK_SIZE: {settings.CHUNK_SIZE}")
    print(f"   QDRANT_HOST: {settings.QDRANT_HOST}")
    print(f"   LLM_MODEL: {settings.OLLAMA_MODEL}")