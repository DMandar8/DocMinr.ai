"""
TXT Parser for plain text files
"""
from typing import Dict, Any
from .base import BaseParser

class TXTParser(BaseParser):  # ← Make sure class name matches
    """Parser for plain text documents"""
    
    def extract_text(self) -> str:
        """Extract text from TXT"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            return self.clean_text(text)
        except UnicodeDecodeError:
            # Try other encoding
            with open(self.file_path, 'r', encoding='latin-1') as f:
                text = f.read()
            return self.clean_text(text)
        except Exception as e:
            raise Exception(f"TXT extraction failed: {str(e)}")
    
    def extract_metadata(self) -> Dict[str, Any]:
        """Extract metadata from TXT"""
        try:
            text = self.extract_text()
            words = text.split()
            lines = text.split('\n')
            
            return {
                "page_count": 1,
                "line_count": len(lines),
                "word_count": len(words),
                "char_count": len(text),
                "file_name": self.file_name,
                "file_size": self.file_path.stat().st_size,
            }
        except Exception as e:
            raise Exception(f"Metadata extraction failed: {str(e)}")