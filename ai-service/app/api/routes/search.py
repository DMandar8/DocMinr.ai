"""
Search Routes
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import logging

from app.qdrant import search_service
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    kb_id: int = Field(None, description="Knowledge Base ID (optional)")
    top_k: int = Field(5, description="Number of results to return", ge=1, le=20)

@router.post("/search")
async def search(request: SearchRequest):
    """
    Search Qdrant for chunks similar to the query
    
    Request:
        query: The search query
        kb_id: Optional knowledge base ID to filter by
        top_k: Number of results to return
    
    Response:
        List of search results with text and metadata
    """
    logger.info(f"📨 Search request: '{request.query[:50]}...'")
    
    try:
        results = await search_service.search(
            query=request.query,
            kb_id=request.kb_id,
            top_k=request.top_k,
        )
        
        return {
            "success": True,
            "query": request.query,
            "total_results": len(results),
            "results": results,
        }
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))