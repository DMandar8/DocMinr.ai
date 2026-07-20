"""
Prompt Builder
Merges system prompt, context, and user question into final prompt
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .config import config
from .templates import (
    get_system_prompt,
    USER_PROMPT_TEMPLATE,
    FULL_PROMPT_TEMPLATE,
    SYSTEM_PROMPTS
)
from .context_builder import context_builder

logger = logging.getLogger(__name__)

class PromptBuilder:
    """Builds complete prompts for LLM consumption"""
    
    def __init__(self):
        self.default_template = config.DEFAULT_TEMPLATE
    
    def build_prompt(
        self,
        query: str,
        results: list,
        template_name: Optional[str] = None,
        top_k: Optional[int] = None,
        include_metadata: bool = False,
    ) -> Dict[str, Any]:
        """
        Build a complete prompt from query and search results
        
        Args:
            query: User's question
            results: Search results from Qdrant
            template_name: Name of system prompt template to use
            top_k: Number of chunks to include
            include_metadata: Include metadata in response
            
        Returns:
            Dictionary with final prompt and metadata
        """
        logger.info(f"🔨 Building prompt for: {query[:50]}...")
        
        # Step 1: Build context
        context_data = context_builder.build_context(query, results, top_k)
        
        if not context_data["has_context"]:
            logger.warning("⚠️ No context available for prompt")
            return {
                "query": query,
                "system_prompt": get_system_prompt(template_name or self.default_template),
                "context": "",
                "user_prompt": query,
                "final_prompt": query,
                "has_context": False,
                "chunks_used": 0,
                "prompt_length": len(query),  
                "timestamp": datetime.now().isoformat(),
            }
        
        # Step 2: Get system prompt
        template = template_name or self.default_template
        system_prompt = get_system_prompt(template)
        
        # Step 3: Build user prompt
        user_prompt = USER_PROMPT_TEMPLATE.format(question=query)
        
        # Step 4: Build final prompt
        final_prompt = FULL_PROMPT_TEMPLATE.format(
            system_prompt=system_prompt,
            context=context_data["context"],
            question=query,
        )
        
        logger.info(f"   ✅ Prompt built ({len(final_prompt)} chars)")
        
        result = {
            "query": query,
            "system_prompt": system_prompt,
            "context": context_data["context"],
            "user_prompt": user_prompt,
            "final_prompt": final_prompt,
            "has_context": True,
            "chunks_used": context_data["chunks_used"],
            "template_used": template,
            "context_length": context_data["context_length"],
            "prompt_length": len(final_prompt),
            "timestamp": datetime.now().isoformat(),
        }
        
        if include_metadata:
            result["chunks"] = context_data["chunks"]
        
        return result

# Singleton instance
prompt_builder = PromptBuilder()