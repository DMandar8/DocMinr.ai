"""
Embedding Service
Orchestrates embedding generation and validation
"""
import json
import logging
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from .config import config
from .embedding_model import embedding_model
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Handles embedding generation and validation"""
    
    def __init__(self):
        # Storage path for embeddings
        self.embeddings_path = Path(settings.STORAGE_PATH) / "embeddings"
        self.embeddings_path.mkdir(parents=True, exist_ok=True)
        
        # Get model info
        self.dimension = embedding_model.get_dimension()
        self.model_name = embedding_model.get_model_name()
        
        logger.info(f"🔧 EmbeddingService initialized")
        logger.info(f"   Model: {self.model_name}")
        logger.info(f"   Dimension: {self.dimension}")
        logger.info(f"   Storage: {self.embeddings_path}")
    
    async def generate_embeddings(self, doc_id: int, chunks: List[str]) -> Dict[str, Any]:
        """
        Generate embeddings for a list of chunks
        
        Args:
            doc_id: Document ID
            chunks: List of text chunks
            
        Returns:
            Dictionary with embedding results
        """
        logger.info(f"📄 Generating embeddings for document {doc_id}")
        logger.info(f"   Total chunks: {len(chunks)}")
        
        if not chunks:
            raise ValueError("No chunks to embed")
        
        try:
            # Step 1: Generate embeddings
            logger.info(f"   🔄 Encoding {len(chunks)} chunks...")
            embeddings = embedding_model.encode(chunks)
            
            logger.info(f"   ✅ Generated {len(embeddings)} embeddings")
            logger.info(f"   Shape: {embeddings.shape}")
            
            # Step 2: Prepare data
            embedding_data = {
                "doc_id": doc_id,
                "model_name": self.model_name,
                "dimension": self.dimension,
                "total_chunks": len(chunks),
                "timestamp": datetime.now().isoformat(),
                "chunks": []
            }
            
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                embedding_data["chunks"].append({
                    "chunk_id": i + 1,
                    "text": chunk,
                    "embedding": embedding.tolist(),
                })
            
            # Step 3: Validate embeddings
            logger.info(f"   🔍 Validating embeddings...")
            validation_results = self._validate_embeddings(embeddings, chunks)
            embedding_data["validation"] = validation_results
            
            # Step 4: Save to JSON
            embedding_file = self.embeddings_path / f"{doc_id}_embeddings.json"
            with open(embedding_file, 'w', encoding='utf-8') as f:
                json.dump(embedding_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"   ✅ Embeddings saved to {embedding_file}")
            logger.info(f"   ✅ Validation: {validation_results['status']}")
            
            return {
                "doc_id": doc_id,
                "success": True,
                "total_chunks": len(chunks),
                "dimension": self.dimension,
                "model_name": self.model_name,
                "embeddings_file": str(embedding_file),
                "validation": validation_results,
                "embedding_preview": embeddings[:5].tolist() if len(embeddings) >= 5 else embeddings.tolist(),
            }
            
        except Exception as e:
            logger.error(f"❌ Embedding generation failed for doc {doc_id}: {str(e)}")
            raise
    
    def _validate_embeddings(self, embeddings: np.ndarray, chunks: List[str]) -> Dict[str, Any]:
        """
        Validate embeddings for consistency and quality
        
        Args:
            embeddings: Numpy array of embeddings
            chunks: List of text chunks
            
        Returns:
            Validation results
        """
        results = {
            "status": "pass",
            "checks": {}
        }
        
        # Check 1: Dimension
        actual_dim = embeddings.shape[1]
        results["checks"]["dimension"] = {
            "expected": self.dimension,
            "actual": actual_dim,
            "passed": actual_dim == self.dimension
        }
        
        if not results["checks"]["dimension"]["passed"]:
            results["status"] = "fail"
        
        # Check 2: Normalization (vectors should have unit length)
        norms = np.linalg.norm(embeddings, axis=1)
        mean_norm = np.mean(norms)
        max_norm = np.max(norms)
        min_norm = np.min(norms)
        
        results["checks"]["normalization"] = {
            "mean_norm": float(mean_norm),
            "max_norm": float(max_norm),
            "min_norm": float(min_norm),
            "passed": np.allclose(norms, 1.0, rtol=1e-3)
        }
        
        if not results["checks"]["normalization"]["passed"]:
            results["status"] = "fail"
        
        # Check 3: Similarity between different chunks
        if len(embeddings) > 1:
            # Calculate cosine similarity between first chunk and others
            similarities = cosine_similarity([embeddings[0]], embeddings)[0]
            results["checks"]["similarity"] = {
                "mean_similarity": float(np.mean(similarities)),
                "max_similarity": float(np.max(similarities)),
                "min_similarity": float(np.min(similarities)),
                "passed": True  # No strict pass/fail, just observation
            }
        
        # Check 4: Embedding uniqueness (not all identical)
        if len(embeddings) > 1:
            unique = np.unique(embeddings, axis=0)
            results["checks"]["uniqueness"] = {
                "unique_embeddings": len(unique),
                "total_embeddings": len(embeddings),
                "passed": len(unique) > 1
            }
            
            if not results["checks"]["uniqueness"]["passed"]:
                results["status"] = "fail"
        
        return results
    
    def load_embeddings(self, doc_id: int) -> Dict[str, Any]:
        """
        Load saved embeddings for a document
        
        Args:
            doc_id: Document ID
            
        Returns:
            Embedding data dictionary
        """
        embedding_file = self.embeddings_path / f"{doc_id}_embeddings.json"
        
        if not embedding_file.exists():
            logger.warning(f"Embeddings file not found for doc {doc_id}")
            return {}
        
        try:
            with open(embedding_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data
        except Exception as e:
            logger.error(f"Failed to load embeddings for doc {doc_id}: {str(e)}")
            return {}

# Create singleton instance
embedding_service = EmbeddingService()