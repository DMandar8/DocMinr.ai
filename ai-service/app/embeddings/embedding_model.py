"""
Embedding Model Management - LAZY LOADING
Model is loaded on first use, not at import time
"""
import logging
import os
from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path

from .config import config

logger = logging.getLogger(__name__)

class EmbeddingModel:
    """Manages the embedding model lifecycle - LAZY LOADING"""
    
    _instance = None
    _model = None
    _is_loaded = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingModel, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        # Don't load model in __init__ - lazy loading!
        pass
    
    def _ensure_model_loaded(self):
        """Load the model if not already loaded"""
        if not self._is_loaded:
            self._load_model()
    
    def _load_model(self):
        """Load the sentence transformer model"""
        try:
            # Set up writable cache directory
            cache_dir = '/app/storage/models/huggingface'
            os.environ['HF_HOME'] = cache_dir
            os.environ['TRANSFORMERS_CACHE'] = os.path.join(cache_dir, 'transformers')
            
            # Create cache directory
            Path(cache_dir).mkdir(parents=True, exist_ok=True)
            
            model_name = config.MODEL_NAME
            device = config.DEVICE
            
            logger.info(f"🔄 Loading embedding model: {model_name}")
            logger.info(f"   Device: {device}")
            logger.info(f"   Dimensions: {config.MODEL_DIMENSION}")
            logger.info(f"   Cache: {cache_dir}")
            
            # Load the model
            self._model = SentenceTransformer(
                model_name,
                device=device,
                cache_folder=os.path.join(cache_dir, 'transformers')
            )
            
            # Verify model output dimension
            test_embedding = self._model.encode(["test"], normalize_embeddings=True)
            actual_dim = test_embedding.shape[1]
            
            if actual_dim != config.MODEL_DIMENSION:
                logger.warning(
                    f"⚠️ Model dimension mismatch: expected {config.MODEL_DIMENSION}, "
                    f"got {actual_dim}. Using {actual_dim}."
                )
                config.MODEL_DIMENSION = actual_dim
            
            self._is_loaded = True
            logger.info(f"✅ Model loaded successfully")
            logger.info(f"   Dimension: {config.MODEL_DIMENSION}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load embedding model: {str(e)}")
            raise
    
    def encode(self, texts: List[str], batch_size: int = None) -> np.ndarray:
        """Encode texts into embeddings - loads model if needed"""
        self._ensure_model_loaded()
        
        if not texts:
            return np.array([])
        
        batch_size = batch_size or config.BATCH_SIZE
        
        try:
            embeddings = self._model.encode(
                texts,
                batch_size=batch_size,
                normalize_embeddings=True,
                show_progress_bar=len(texts) > 100,
                convert_to_numpy=True,
            )
            return embeddings
        except Exception as e:
            logger.error(f"❌ Failed to encode texts: {str(e)}")
            raise
    
    def get_dimension(self) -> int:
        self._ensure_model_loaded()
        return config.MODEL_DIMENSION
    
    def get_model_name(self) -> str:
        self._ensure_model_loaded()
        return config.MODEL_NAME
    
    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

# Singleton instance - model NOT loaded yet!
embedding_model = EmbeddingModel()