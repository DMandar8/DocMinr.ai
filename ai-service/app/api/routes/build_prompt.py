"""
Build Prompt Routes
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import logging
from typing import Optional, List

from app.prompting import prompt_builder
from app.qdrant import search_service

logger = logging.getLogger(__name__)
router = APIRouter()

class BuildPromptRequest(BaseModel):
    query: str = Field(..., description="User's question")
    kb_id: int = Field(None, description="Knowledge Base ID (optional)")
    top_k: int = Field(5, description="Number of chunks to retrieve", ge=1, le=10)
    template: str = Field("qa", description="Prompt template to use")

class BuildPromptResponse(BaseModel):
    success: bool
    query: str
    final_prompt: str
    system_prompt: str
    context: str
    user_prompt: str
    has_context: bool
    chunks_used: int
    template_used: str
    context_length: int
    prompt_length: int
    chunks: Optional[List[dict]] = None

@router.post("/build-prompt")
async def build_prompt(request: BuildPromptRequest):
    """
    Build a complete prompt from a query
    
    This endpoint:
    1. Embeds the query
    2. Searches Qdrant
    3. Builds context from retrieved chunks
    4. Constructs a complete prompt
    
    No LLM is used - this is the prompt preparation stage.
    """
    logger.info("=" * 60)
    logger.info(f"📨 BUILD PROMPT REQUEST")
    logger.info(f"   Query: {request.query[:50]}...")
    logger.info(f"   KB ID: {request.kb_id}")
    logger.info(f"   Top-K: {request.top_k}")
    logger.info(f"   Template: {request.template}")
    logger.info("=" * 60)
    
    try:
        # Step 1: Search Qdrant
        logger.info("🔍 Step 1: Searching Qdrant...")
        results = await search_service.search(
            query=request.query,
            kb_id=request.kb_id,
            top_k=request.top_k,
        )
        logger.info(f"   ✅ Found {len(results)} results")
        
        # Step 2: Build prompt
        logger.info("🔨 Step 2: Building prompt...")
        prompt_data = prompt_builder.build_prompt(
            query=request.query,
            results=results,
            template_name=request.template,
            top_k=request.top_k,
            include_metadata=True,
        )
        logger.info(f"   ✅ Prompt built ({prompt_data['prompt_length']} chars)")
        
        # Step 3: Return response
        response = {
            "success": True,
            "query": prompt_data["query"],
            "final_prompt": prompt_data["final_prompt"],
            "system_prompt": prompt_data["system_prompt"],
            "context": prompt_data["context"],
            "user_prompt": prompt_data["user_prompt"],
            "has_context": prompt_data["has_context"],
            "chunks_used": prompt_data["chunks_used"],
            "template_used": prompt_data["template_used"],
            "context_length": prompt_data["context_length"],
            "prompt_length": prompt_data["prompt_length"],
            "chunks": prompt_data.get("chunks", []),
        }
        
        logger.info(f"📤 Response: success={True}, chunks={prompt_data['chunks_used']}")
        logger.info("=" * 60)
        return response
        
    except Exception as e:
        logger.error(f"❌ Build prompt failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates")
async def list_templates():
    """
    List all available prompt templates
    """
    from app.prompting import SYSTEM_PROMPTS
    return {
        "success": True,
        "templates": list(SYSTEM_PROMPTS.keys()),
        "descriptions": {
            name: SYSTEM_PROMPTS[name].split("\n")[0] 
            for name in SYSTEM_PROMPTS.keys()
        },
    }