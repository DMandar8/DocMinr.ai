"""
Abstract Base Parser - All parsers inherit from this
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
from pathlib import Path
import re

class BaseParser(ABC):
    """Base class for all document parsers"""
    
    def __init__(self, file_path: str):
        self.file_path = Path(file_path)
        self.file_name = self.file_path.name
        self.extension = self.file_path.suffix.lower()
        
        if not self.file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
    
    @abstractmethod
    def extract_text(self) -> str:
        """Extract text from document"""
        pass
    
    @abstractmethod
    def extract_metadata(self) -> Dict[str, Any]:
        """Extract metadata from document"""
        pass
    
    def clean_text(self, text: str) -> str:
        """Clean extracted text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        text = '\n'.join(lines)
        
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text
    
    def get_file_info(self) -> Dict[str, Any]:
        """Get basic file information"""
        return {
            "file_name": self.file_name,
            "file_extension": self.extension,
            "file_size": self.file_path.stat().st_size,
        }