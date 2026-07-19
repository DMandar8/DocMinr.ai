"""
Qdrant Indexing Service
Handles indexing documents into Qdrant
"""
import logging
from typing import List, Dict, Any
from uuid import uuid4
from qdrant_client.http import models

from .client import qdrant_client
from .collection_manager import collection_manager
from .config import config
from app.core.config import settings

logger = logging.getLogger(__name__)

class IndexingService:
    """Handles indexing documents into Qdrant"""
    
    def __init__(self):
        self.client = qdrant_client.get_client()
        self.collection_name = settings.QDRANT_COLLECTION or config.COLLECTION_NAME
        
        # Ensure collection exists
        collection_manager.create_collection()
    
    async def index_document(self, doc_id: int, kb_id: int, chunks: List[str], embeddings: List[List[float]]) -> Dict[str, Any]:
        """
        Index a document's chunks and embeddings into Qdrant
        
        Args:
            doc_id: Document ID
            kb_id: Knowledge Base ID
            chunks: List of text chunks
            embeddings: List of embedding vectors
            
        Returns:
            Dictionary with indexing results
        """
        logger.info(f"📤 Indexing document {doc_id} into Qdrant")
        logger.info(f"   KB ID: {kb_id}")
        logger.info(f"   Total chunks: {len(chunks)}")
        
        if len(chunks) != len(embeddings):
            raise ValueError(f"Chunks count ({len(chunks)}) and embeddings count ({len(embeddings)}) don't match")
        
        if not chunks:
            raise ValueError("No chunks to index")
        
        try:
            # Prepare points
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point = models.PointStruct(
                    id=str(uuid4()),  # Unique ID for each point
                    vector=embedding,
                    payload={
                        "doc_id": doc_id,
                        "kb_id": kb_id,
                        "chunk_id": i + 1,
                        "text": chunk,
                        "total_chunks": len(chunks),
                    }
                )
                points.append(point)
            
            # Batch upsert
            logger.info(f"   🔄 Upserting {len(points)} points...")
            
            # Use batch size from config
            batch_size = settings.QDRANT_BATCH_SIZE or config.BATCH_SIZE
            
            # Upsert in batches
            total_upserted = 0
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=batch,
                )
                total_upserted += len(batch)
                logger.info(f"   ✅ Upserted batch {i//batch_size + 1}: {len(batch)} points")
            
            logger.info(f"✅ Indexed {total_upserted} points for document {doc_id}")
            
            return {
                "doc_id": doc_id,
                "kb_id": kb_id,
                "success": True,
                "total_chunks": len(chunks),
                "points_indexed": total_upserted,
                "collection": self.collection_name,
            }
            
        except Exception as e:
            logger.error(f"❌ Indexing failed for doc {doc_id}: {str(e)}")
            raise
    
    async def delete_document(self, doc_id: int) -> Dict[str, Any]:
        """
        Delete all points belonging to a document
        
        Args:
            doc_id: Document ID
            
        Returns:
            Dictionary with deletion results
        """
        try:
            # Delete points with matching doc_id
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="doc_id",
                            match=models.MatchValue(value=doc_id),
                        )
                    ]
                ),
            )
            
            logger.info(f"🗑️ Deleted document {doc_id} from Qdrant")
            return {
                "doc_id": doc_id,
                "success": True,
                "message": f"Document {doc_id} deleted from Qdrant",
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to delete document {doc_id}: {str(e)}")
            raise
    
    async def delete_knowledge_base(self, kb_id: int) -> Dict[str, Any]:
        """
        Delete all points belonging to a knowledge base
        
        Args:
            kb_id: Knowledge Base ID
            
        Returns:
            Dictionary with deletion results
        """
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="kb_id",
                            match=models.MatchValue(value=kb_id),
                        )
                    ]
                ),
            )
            
            logger.info(f"🗑️ Deleted knowledge base {kb_id} from Qdrant")
            return {
                "kb_id": kb_id,
                "success": True,
                "message": f"Knowledge base {kb_id} deleted from Qdrant",
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to delete knowledge base {kb_id}: {str(e)}")
            raise

# Singleton instance
indexing_service = IndexingService()