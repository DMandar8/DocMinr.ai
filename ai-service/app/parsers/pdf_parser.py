"""
PDF Parser using pdfplumber
"""
from typing import Dict, Any
import pdfplumber
from .base import BaseParser

class PDFParser(BaseParser):
    """Parser for PDF documents"""
    
    def extract_text(self) -> str:
        """Extract text from PDF"""
        try:
            text = ""
            with pdfplumber.open(self.file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
            return self.clean_text(text)
        except Exception as e:
            raise Exception(f"PDF extraction failed: {str(e)}")
    
    def extract_metadata(self) -> Dict[str, Any]:
        """Extract metadata from PDF"""
        try:
            with pdfplumber.open(self.file_path) as pdf:
                text = self.extract_text()
                words = text.split()
                
                return {
                    "page_count": len(pdf.pages),
                    "word_count": len(words),
                    "char_count": len(text),
                    "file_name": self.file_name,
                    "file_size": self.file_path.stat().st_size,
                }
        except Exception as e:
            raise Exception(f"Metadata extraction failed: {str(e)}")