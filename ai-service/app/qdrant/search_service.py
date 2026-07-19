"""
Qdrant Search Service
Handles semantic search queries
"""
import logging
from typing import List, Dict, Any, Optional
from qdrant_client.http import models

from .client import qdrant_client
from .config import config
from app.core.config import settings
from app.embeddings.embedding_model import embedding_model

logger = logging.getLogger(__name__)

class SearchService:
    """Handles semantic search queries"""
    
    def __init__(self):
        self.client = qdrant_client.get_client()
        self.collection_name = settings.QDRANT_COLLECTION or config.COLLECTION_NAME
        self.top_k = settings.DEFAULT_TOP_K or 5
    
    async def search(self, query: str, kb_id: Optional[int] = None, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Search Qdrant for chunks similar to the query
        
        Args:
            query: The search query
            kb_id: Optional knowledge base ID to filter by
            top_k: Number of results to return
            
        Returns:
            List of search results with text and metadata
        """
        logger.info(f"🔍 Searching: '{query[:50]}...'")
        
        if not query:
            return []
        
        top_k = top_k or self.top_k
        
        try:
            # 1. Generate embedding for the query
            logger.info(f"   🔄 Generating query embedding...")
            query_embedding = embedding_model.encode([query])[0]
            
            # 2. Build filter
            filter_condition = None
            if kb_id:
                filter_condition = models.Filter(
                    must=[
                        models.FieldCondition(
                            key="kb_id",
                            match=models.MatchValue(value=kb_id),
                        )
                    ]
                )
            
            # 3. Search Qdrant
            logger.info(f"   🔍 Searching Qdrant (top_k={top_k})...")
            
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding.tolist(),
                limit=top_k,
                query_filter=filter_condition,
                with_payload=True,
            )
            
            # 4. Format results
            results = []
            for hit in search_result:
                results.append({
                    "score": hit.score,
                    "doc_id": hit.payload.get("doc_id"),
                    "kb_id": hit.payload.get("kb_id"),
                    "chunk_id": hit.payload.get("chunk_id"),
                    "text": hit.payload.get("text"),
                    "total_chunks": hit.payload.get("total_chunks"),
                })
            
            logger.info(f"   ✅ Found {len(results)} results")
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Search failed: {str(e)}")
            raise
    
    async def search_document(self, doc_id: int, query: str, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Search within a specific document
        
        Args:
            doc_id: Document ID
            query: The search query
            top_k: Number of results to return
            
        Returns:
            List of search results
        """
        return await self.search(query, doc_id=doc_id, top_k=top_k)

# Singleton instance
search_service = SearchService()