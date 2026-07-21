"""
Generation Service
Orchestrates the entire RAG generation pipeline
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .client import llm_client
from app.qdrant import search_service
from app.prompting import prompt_builder
from app.prompting.templates import get_system_prompt

logger = logging.getLogger(__name__)

class GenerationService:
    """Orchestrates RAG generation"""
    
    def __init__(self):
        self.llm_client = llm_client
    
    async def generate_answer(
        self,
        query: str,
        kb_id: Optional[int] = None,
        top_k: int = 5,
        template: str = "qa",
        temperature: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Generate an answer using RAG
        
        Args:
            query: User's question
            kb_id: Optional knowledge base ID
            top_k: Number of chunks to retrieve
            template: Prompt template to use
            temperature: LLM temperature
            
        Returns:
            Dictionary with answer, sources, and metadata
        """
        logger.info("=" * 60)
        logger.info(f"📨 GENERATING ANSWER")
        logger.info(f"   Query: {query[:50]}...")
        logger.info(f"   KB ID: {kb_id}")
        logger.info(f"   Top-K: {top_k}")
        logger.info(f"   Template: {template}")
        logger.info("=" * 60)
        
        try:
            # Step 1: Search Qdrant
            logger.info("🔍 Step 1: Searching Qdrant...")
            results = await search_service.search(
                query=query,
                kb_id=kb_id,
                top_k=top_k,
            )
            logger.info(f"   ✅ Found {len(results)} results")
            
            # Step 2: Build prompt
            logger.info("🔨 Step 2: Building prompt...")
            prompt_data = prompt_builder.build_prompt(
                query=query,
                results=results,
                template_name=template,
                top_k=top_k,
                include_metadata=True,
            )
            logger.info(f"   ✅ Prompt built ({prompt_data['prompt_length']} chars)")
            
            # Step 3: Generate answer with LLM
            logger.info("🤖 Step 3: Generating answer with Gemini...")
            
            if not prompt_data["has_context"]:
                logger.warning("⚠️ No context available")
                return {
                    "success": True,
                    "query": query,
                    "answer": "I don't have enough information to answer that question. Please upload relevant documents first.",
                    "sources": [],
                    "has_context": False,
                    "chunks_used": 0,
                    "template_used": template,
                    "timestamp": datetime.now().isoformat(),
                }
            
            # Get system prompt
            system_prompt = get_system_prompt(template)
            
            # Generate
            llm_response = await self.llm_client.generate(
                prompt=prompt_data["final_prompt"],
                system_prompt=system_prompt,
                temperature=temperature,
            )
            
            if not llm_response.get("success", False):
                return {
                    "success": False,
                    "query": query,
                    "error": llm_response.get("error", "LLM generation failed"),
                    "sources": prompt_data.get("chunks", []),
                    "timestamp": datetime.now().isoformat(),
                }
            
            logger.info(f"   ✅ Answer generated ({len(llm_response['answer'])} chars)")
            logger.info("=" * 60)
            
            return {
                "success": True,
                "query": query,
                "answer": llm_response["answer"],
                "sources": prompt_data.get("chunks", []),
                "has_context": True,
                "chunks_used": prompt_data["chunks_used"],
                "template_used": template,
                "model": llm_response.get("model"),
                "total_tokens": llm_response.get("total_tokens", 0),
                "timestamp": datetime.now().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"❌ Generation failed: {str(e)}")
            return {
                "success": False,
                "query": query,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }

# Singleton instance
generation_service = GenerationService()