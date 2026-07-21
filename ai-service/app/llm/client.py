"""
LLM Client - Google Gemini Interactions API
"""
import logging
from typing import Optional, Dict, Any, AsyncGenerator
import os
from google import genai

from .config import config

logger = logging.getLogger(__name__)

class LLMClient:
    """Client for Google Gemini Interactions API"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMClient, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        self.api_key = None
        self.model = config.GEMINI_MODEL or "gemini-3.6-flash"
        self._configure_client()
    
    def _configure_client(self):
        """Configure Gemini with API key"""
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            logger.warning("⚠️ GEMINI_API_KEY not set in environment")
            return
        
        self.client = genai.Client(api_key=self.api_key)
        logger.info(f"✅ Gemini client configured with model: {self.model}")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        previous_interaction_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a response using Gemini Interactions API
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            previous_interaction_id: ID of previous interaction for multi-turn
            
        Returns:
            Dictionary with response and metadata
        """
        if not self.api_key:
            return {
                "success": False,
                "error": "GEMINI_API_KEY not configured. Please set the environment variable.",
            }
        
        try:
            # Build the input with system prompt if provided
            if system_prompt:
                input_text = f"{system_prompt}\n\nUser: {prompt}"
            else:
                input_text = prompt
            
            logger.info(f"📤 Sending request to Gemini")
            logger.debug(f"   Model: {self.model}")
            logger.debug(f"   Temperature: {temperature or config.TEMPERATURE}")
            
            # Create interaction
            interaction = self.client.interactions.create(
                model=self.model,
                input=input_text,
                previous_interaction_id=previous_interaction_id,
            )
            
            # Check for errors
            if interaction.status == "failed":
                return {
                    "success": False,
                    "error": getattr(interaction, "error", "Unknown error"),
                }
            
            # Get the response
            answer = interaction.output_text or ""
            
            # Build response
            response = {
                "success": True,
                "answer": answer,
                "model": self.model,
                "interaction_id": interaction.id,
                "status": interaction.status,
                "total_tokens": getattr(interaction.usage, "total_tokens", 0),
                "input_tokens": getattr(interaction.usage, "total_input_tokens", 0),
                "output_tokens": getattr(interaction.usage, "total_output_tokens", 0),
            }
            
            logger.info(f"   ✅ Response received ({len(answer)} chars)")
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Gemini request failed: {str(e)}")
            return {
                "success": False,
                "error": f"Gemini error: {str(e)}",
            }
    
    async def health_check(self) -> bool:
        """Check if Gemini API is working"""
        try:
            if not self.api_key:
                return False
            
            interaction = self.client.interactions.create(
                model=self.model,
                input="Hello, are you working?",
            )
            return interaction.status == "completed" and bool(interaction.output_text)
            
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False

# Singleton instance
llm_client = LLMClient()