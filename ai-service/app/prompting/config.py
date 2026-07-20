"""
Prompting Configuration
"""
from typing import Optional, List

class PromptingConfig:
    """Configuration for prompt construction"""
    
    # Default number of chunks to include
    DEFAULT_TOP_K: int = 5
    
    # Maximum context length (characters)
    MAX_CONTEXT_LENGTH: int = 4000
    
    # Separator between chunks
    CHUNK_SEPARATOR: str = "\n\n---\n\n"
    
    # System prompt template name
    DEFAULT_TEMPLATE: str = "qa"
    
    # Include scores in context (for debugging)
    INCLUDE_SCORES: bool = True
    
    # Include chunk IDs (for source attribution)
    INCLUDE_CHUNK_IDS: bool = True

# Default configuration
config = PromptingConfig()