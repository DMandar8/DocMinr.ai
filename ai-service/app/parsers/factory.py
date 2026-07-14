"""
Parser Factory - Chooses the right parser based on file type
"""
from typing import Optional
from pathlib import Path
from .base import BaseParser
from .pdf_parser import PDFParser
from .docx_parser import DOCXParser
from .txt_parser import TXTParser

PARSER_MAP = {
    '.pdf': PDFParser,
    '.docx': DOCXParser,
    '.doc': DOCXParser,
    '.txt': TXTParser,
    '.md': TXTParser,
    '.csv': TXTParser,
    '.json': TXTParser,
}

class ParserFactory:
    """Factory for creating document parsers"""
    
    @staticmethod
    def get_parser(file_path: str) -> BaseParser:
        """Get the appropriate parser for a file"""
        path = Path(file_path)
        extension = path.suffix.lower()
        
        if extension not in PARSER_MAP:
            raise ValueError(
                f"Unsupported file type: {extension}. "
                f"Supported: {list(PARSER_MAP.keys())}"
            )
        
        parser_class = PARSER_MAP[extension]
        return parser_class(file_path)
    
    @staticmethod
    def get_supported_extensions() -> list:
        """Get list of supported extensions"""
        return list(PARSER_MAP.keys())