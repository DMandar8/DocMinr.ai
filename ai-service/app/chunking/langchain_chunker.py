"""
LangChain Chunking Implementation
Uses RecursiveCharacterTextSplitter
"""
from typing import List
from .manual_chunker import ManualChunker
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .config import config
import logging
logger = logging.getLogger(__name__)



class LangChainChunker:
    """LangChain implementation of text chunking"""
    
    def __init__(
        self,
        chunk_size: int = None,
        chunk_overlap: int = None,
        separators: List[str] = None,
    ):
        self.chunk_size = chunk_size or config.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or config.CHUNK_OVERLAP
        self.separators = separators or config.SEPARATORS
        self.min_chunk_size = config.MIN_CHUNK_SIZE
        
        # Initialize LangChain splitter
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=self.separators,
            length_function=len,
            keep_separator=True,
        )
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into chunks using LangChain
        
        Args:
            text: The text to split
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        try:
            chunks = self.splitter.split_text(text)
            return [chunk for chunk in chunks if len(chunk) >= self.min_chunk_size]
        except Exception as e:
            logger.error(f"LangChain chunking failed: {e}")
            # Fallback to manual chunker
            return ManualChunker().chunk_text(text)
        
        