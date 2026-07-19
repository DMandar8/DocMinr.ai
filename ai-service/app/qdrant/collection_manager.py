"""
Qdrant Collection Manager
Handles collection creation, deletion, and management
"""
import logging
from typing import Optional, List
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse

from .client import qdrant_client
from .config import config
from app.core.config import settings

logger = logging.getLogger(__name__)

class CollectionManager:
    """Manages Qdrant collections"""
    
    def __init__(self):
        self.client = qdrant_client.get_client()
        self.collection_name = settings.QDRANT_COLLECTION or config.COLLECTION_NAME
        self.vector_size = settings.QDRANT_VECTOR_SIZE or config.VECTOR_SIZE
        self.distance = settings.QDRANT_DISTANCE or config.DISTANCE
    
    def create_collection(self, force: bool = False) -> bool:
        """
        Create the collection if it doesn't exist
        
        Args:
            force: If True, recreate the collection
            
        Returns:
            True if created, False if already exists
        """
        try:
            # Check if collection exists
            collections = self.client.get_collections()
            exists = any(c.name == self.collection_name for c in collections.collections)
            
            if exists and not force:
                logger.info(f"📂 Collection '{self.collection_name}' already exists")
                return False
            
            if exists and force:
                logger.info(f"🗑️ Deleting existing collection '{self.collection_name}'")
                self.client.delete_collection(self.collection_name)
            
            # Create collection
            logger.info(f"📦 Creating collection '{self.collection_name}'")
            logger.info(f"   Vector size: {self.vector_size}")
            logger.info(f"   Distance: {self.distance}")
            
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=self.vector_size,
                    distance=models.Distance.COSINE if self.distance.lower() == "cosine" 
                           else models.Distance.DOT if self.distance.lower() == "dot"
                           else models.Distance.EUCLID,
                ),
            )
            
            # Create payload indexes for faster filtering
            self._create_indexes()
            
            logger.info(f"✅ Collection '{self.collection_name}' created successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create collection: {str(e)}")
            raise
    
    def _create_indexes(self):
        """Create indexes on payload fields for faster queries"""
        try:
            # Index doc_id for faster filtering
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="doc_id",
                field_type=models.PayloadSchemaType.INTEGER,
            )
            
            # Index kb_id for faster filtering
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="kb_id",
                field_type=models.PayloadSchemaType.INTEGER,
            )
            
            logger.info(f"   ✅ Payload indexes created")
            
        except Exception as e:
            logger.warning(f"   ⚠️ Could not create indexes: {str(e)}")
    
    def delete_collection(self) -> bool:
        """Delete the collection"""
        try:
            self.client.delete_collection(self.collection_name)
            logger.info(f"🗑️ Collection '{self.collection_name}' deleted")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete collection: {str(e)}")
            return False
    
    def collection_exists(self) -> bool:
        """Check if collection exists"""
        try:
            collections = self.client.get_collections()
            return any(c.name == self.collection_name for c in collections.collections)
        except Exception:
            return False
    
    def get_collection_info(self) -> dict:
        """Get collection information"""
        try:
            info = self.client.get_collection(self.collection_name)
            return {
                "name": self.collection_name,
                "points_count": info.points_count,
                "vectors_count": info.vectors_count,
                "status": info.status,
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {str(e)}")
            return {}

# Singleton instance
collection_manager = CollectionManager()