"""
Embedding Configuration
"""
from typing import Optional

class EmbeddingConfig:
    """Configuration for embedding generation"""
    
    # Model configuration - use direct values
    MODEL_NAME: str = "BAAI/bge-base-en-v1.5"
    MODEL_DIMENSION: int = 768
    
    # Generation settings
    BATCH_SIZE: int = 32
    DEVICE: str = "cpu"  # Use "mps" for Apple Silicon if available
    
    # Similarity threshold for validation
    SIMILARITY_THRESHOLD: float = 0.5
    
    # Path to store embeddings
    STORAGE_PATH: Optional[str] = None

# Default configuration
config = EmbeddingConfig()