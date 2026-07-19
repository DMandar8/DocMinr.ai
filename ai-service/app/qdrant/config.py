"""
Qdrant Configuration
"""
from typing import Optional

class QdrantConfig:
    """Configuration for Qdrant vector database"""
    
    # Connection settings
    HOST: str = "qdrant"
    PORT: int = 6333
    GRPC_PORT: int = 6334
    PREFER_GRPC: bool = False
    
    # Collection settings
    COLLECTION_NAME: str = "docminr_docs"
    VECTOR_SIZE: int = 768
    DISTANCE: str = "Cosine"
    
    # Operation settings
    BATCH_SIZE: int = 64
    TIMEOUT: int = 30
    
    # Index settings
    INDEX_FIELDS: list = ["doc_id", "kb_id", "chunk_id"]

# Default configuration
config = QdrantConfig()