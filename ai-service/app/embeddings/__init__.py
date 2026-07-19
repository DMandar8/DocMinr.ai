"""
Embeddings module for generating and managing document embeddings
"""
from .config import config
from .embedding_model import embedding_model
from .embedding_service import embedding_service

__all__ = [
    'config',
    'embedding_model',
    'embedding_service',
]