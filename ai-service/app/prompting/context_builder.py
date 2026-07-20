"""
Context Builder
Assembles retrieved chunks into a structured context
"""
import logging
from typing import List, Dict, Any
from .config import config

logger = logging.getLogger(__name__)

class ContextBuilder:
    """Builds context from retrieved chunks"""
    
    def __init__(self):
        self.separator = config.CHUNK_SEPARATOR
        self.max_length = config.MAX_CONTEXT_LENGTH
        self.include_scores = config.INCLUDE_SCORES
        self.include_chunk_ids = config.INCLUDE_CHUNK_IDS
    
    def build_context(self, query: str, results: List[Dict[str, Any]], top_k: int = None) -> Dict[str, Any]:
        """
        Build context from search results
        
        Args:
            query: The user's question
            results: Search results from Qdrant
            top_k: Number of results to include (optional)
            
        Returns:
            Dictionary with context, chunks, and metadata
        """
        logger.info(f"📝 Building context for query: {query[:50]}...")
        logger.info(f"   Results: {len(results)}")
        
        if not results:
            return {
                "query": query,
                "context": "",
                "chunks": [],
                "total_chunks": 0,
                "has_context": False,
                "chunks_used": 0,
            }
        
        # Limit to top_k if specified
        top_k = top_k or config.DEFAULT_TOP_K
        results = results[:top_k]
        
        # Build context string
        context_parts = []
        chunks_data = []
        
        for i, result in enumerate(results, 1):
            # Format chunk with header
            chunk_text = result.get("text", "")
            chunk_id = result.get("chunk_id")
            score = result.get("score")
            
            # Build header
            header_parts = [f"[Chunk {i}"]
            if self.include_chunk_ids and chunk_id:
                header_parts.append(f"ID: {chunk_id}")
            if self.include_scores and score is not None:
                header_parts.append(f"Score: {score:.3f}")
            header = " | ".join(header_parts) + "]"
            
            # Build full chunk
            chunk_content = f"{header}\n{chunk_text}"
            context_parts.append(chunk_content)
            
            # Store chunk data for metadata
            chunks_data.append({
                "position": i,
                "chunk_id": chunk_id,
                "score": score,
                "text": chunk_text,
                "doc_id": result.get("doc_id"),
                "kb_id": result.get("kb_id"),
            })
        
        context = self.separator.join(context_parts)
        
        # Truncate if too long
        if len(context) > self.max_length:
            logger.warning(f"   ⚠️ Context truncated from {len(context)} to {self.max_length} chars")
            context = context[:self.max_length] + "\n\n[Context truncated due to length limit]"
        
        logger.info(f"   ✅ Built context with {len(results)} chunks ({len(context)} chars)")
        
        return {
            "query": query,
            "context": context,
            "chunks": chunks_data,
            "total_chunks": len(results),
            "has_context": len(results) > 0,
            "chunks_used": len(results),
            "context_length": len(context),
        }

# Singleton instance
context_builder = ContextBuilder()