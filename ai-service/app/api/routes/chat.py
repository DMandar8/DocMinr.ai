"""
Chat Routes - RAG Generation
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import logging
from typing import Optional

from app.llm import generation_service

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatRequest(BaseModel):
    query: str = Field(..., description="User's question")
    kb_id: Optional[int] = Field(None, description="Knowledge Base ID (optional)")
    top_k: int = Field(5, description="Number of chunks to retrieve", ge=1, le=10)
    template: str = Field("qa", description="Prompt template to use")
    temperature: Optional[float] = Field(None, description="LLM temperature", ge=0.0, le=1.0)

class ChatResponse(BaseModel):
    success: bool
    query: str
    answer: Optional[str] = None
    error: Optional[str] = None
    sources: Optional[list] = None
    has_context: Optional[bool] = None
    chunks_used: Optional[int] = None
    template_used: Optional[str] = None
    model: Optional[str] = None
    total_tokens: Optional[int] = None
    timestamp: Optional[str] = None

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    RAG Chat endpoint using Gemini
    
    This endpoint:
    1. Searches Qdrant for relevant chunks
    2. Builds a prompt with context
    3. Generates an answer using Gemini API
    
    Returns:
        Answer with source attribution
    """
    logger.info("=" * 60)
    logger.info(f"💬 CHAT REQUEST")
    logger.info(f"   Query: {request.query[:50]}...")
    logger.info(f"   KB ID: {request.kb_id}")
    logger.info(f"   Top-K: {request.top_k}")
    logger.info(f"   Template: {request.template}")
    logger.info("=" * 60)
    
    try:
        result = await generation_service.generate_answer(
            query=request.query,
            kb_id=request.kb_id,
            top_k=request.top_k,
            template=request.template,
            temperature=request.temperature,
        )
        
        if not result.get("success", False):
            raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Chat failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/health")
async def chat_health():
    """Check LLM service health"""
    from app.llm import llm_client
    healthy = await llm_client.health_check()
    return {
        "success": True,
        "llm_healthy": healthy,
        "service": "DocMinr.ai Chat Service",
    }