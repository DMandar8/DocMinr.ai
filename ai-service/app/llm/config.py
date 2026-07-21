"""
LLM Configuration - Gemini
"""
from typing import Optional

class LLMConfig:
    """Configuration for Gemini LLM"""
    
    # Gemini settings
    GEMINI_MODEL: str = "gemini-3.6-flash"
    # Alternatives: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-pro
    
    # Generation settings
    TEMPERATURE: float = 0.3
    MAX_TOKENS: int = 2048
    TOP_P: float = 0.9
    TOP_K: int = 40
    
    # Timeout settings
    REQUEST_TIMEOUT: int = 60  # seconds
    
    # System prompt
    DEFAULT_SYSTEM_PROMPT: str = "You are a helpful assistant."

# Default configuration
config = LLMConfig()