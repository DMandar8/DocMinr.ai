"""
Qdrant Client
Handles connection to Qdrant vector database
"""
import logging
from typing import Optional
from qdrant_client import QdrantClient as QdrantClientBase
from qdrant_client.http.exceptions import UnexpectedResponse

from .config import config
from app.core.config import settings

logger = logging.getLogger(__name__)

class QdrantClient:
    """Singleton Qdrant client"""
    
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(QdrantClient, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self._connect()
    
    def _connect(self):
        """Connect to Qdrant"""
        try:
            host = settings.QDRANT_HOST or config.HOST
            port = settings.QDRANT_PORT or config.PORT
            
            logger.info(f"🔗 Connecting to Qdrant at {host}:{port}")
            
            self._client = QdrantClientBase(
                host=host,
                port=port,
                timeout=settings.QDRANT_BATCH_SIZE or config.TIMEOUT,
            )
            
            # Test connection
            self._client.get_collections()
            logger.info(f"✅ Connected to Qdrant successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to Qdrant: {str(e)}")
            raise
    
    def get_client(self):
        """Get the Qdrant client instance"""
        if self._client is None:
            self._connect()
        return self._client
    
    def health_check(self) -> bool:
        """Check if Qdrant is healthy"""
        try:
            self._client.get_collections()
            return True
        except Exception:
            return False
    
    def close(self):
        """Close the Qdrant connection"""
        if self._client:
            self._client.close()
            self._client = None
            logger.info("🔒 Qdrant connection closed")

# Singleton instance
qdrant_client = QdrantClient()