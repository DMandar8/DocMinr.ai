"""
Parsers module for extracting text from documents
"""
from .base import BaseParser
from .pdf_parser import PDFParser
from .docx_parser import DOCXParser
from .txt_parser import TXTParser
from .factory import ParserFactory

__all__ = [
    'BaseParser',
    'PDFParser',
    'DOCXParser',
    'TXTParser',
    'ParserFactory',
]