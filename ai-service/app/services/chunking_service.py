"""
Chunking Service
Orchestrates document chunking
"""
import logging
from typing import List, Dict, Any
from pathlib import Path
import json
from datetime import datetime


from app.chunking import ManualChunker, LangChainChunker, config
from app.core.config import settings

logger = logging.getLogger(__name__)

class ChunkingService:
    """Handles document chunking"""
    
    def __init__(self, use_langchain: bool = True):
        """
        Initialize chunking service
        
        Args:
            use_langchain: Use LangChain (True) or manual implementation (False)
        """
        self.use_langchain = use_langchain
        self.chunker = LangChainChunker() if use_langchain else ManualChunker()
        
        # Storage path for chunks
        self.chunks_path = Path(settings.STORAGE_PATH) / "chunks"
        self.chunks_path.mkdir(parents=True, exist_ok=True)

        logger.info(f"STORAGE_PATH = {settings.STORAGE_PATH}")
        logger.info(f"Chunks path = {self.chunks_path}")
        
        logger.info(f"🔧 ChunkingService initialized")
        logger.info(f"   Using LangChain: {use_langchain}")
        logger.info(f"   Chunk size: {config.CHUNK_SIZE}")
        logger.info(f"   Chunk overlap: {config.CHUNK_OVERLAP}")
        logger.info(f"   Chunks path: {self.chunks_path}")
    
    async def chunk_document(self, doc_id: int, text: str) -> Dict[str, Any]:
        """
        Chunk a document's text
        
        Args:
            doc_id: Document ID
            text: The extracted text
            
        Returns:
            Dictionary with chunking results
        """
        logger.info(f"📄 Chunking document {doc_id}")
        
        try:
            # Step 1: Chunk the text
            chunks = self.chunker.chunk_text(text)
            
            logger.info(f"   Generated {len(chunks)} chunks")
            
            # Step 2: Save chunks to file
            chunks_file = self.chunks_path / f"{doc_id}_chunks.json"
            chunks_data = {
                "doc_id": doc_id,
                "total_chunks": len(chunks),
                "chunks": chunks,
                "metadata": {
                    "chunk_size": config.CHUNK_SIZE,
                    "chunk_overlap": config.CHUNK_OVERLAP,
                    "chunker": "langchain" if self.use_langchain else "manual",
                    # "created_at": str(Path(chunks_file).stat().st_ctime),
                    "created_at": str(datetime.now().isoformat()),
                }
            }
            
            with open(chunks_file, 'w', encoding='utf-8') as f:
                json.dump(chunks_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"   ✅ Chunks saved to {chunks_file}")

            # After saving chunks, add to metadata
            chunks_data["metadata"].update({
                "avg_chunk_size": sum(len(c) for c in chunks) / len(chunks) if chunks else 0,
                "min_chunk_size": min((len(c) for c in chunks), default=0),
                "max_chunk_size": max((len(c) for c in chunks), default=0),
            })
            
            return {
                "doc_id": doc_id,
                "success": True,
                "total_chunks": len(chunks),
                "chunks": chunks[:5],  # Return first 5 for preview
                "chunks_file": str(chunks_file),
                "metadata": chunks_data["metadata"],
            }
            
        except Exception as e:
            logger.error(f"❌ Chunking failed for doc {doc_id}: {str(e)}")
            raise
    
    def get_chunks(self, doc_id: int) -> List[str]:
        """
        Retrieve chunks for a document
        
        Args:
            doc_id: Document ID
            
        Returns:
            List of text chunks
        """
        chunks_file = self.chunks_path / f"{doc_id}_chunks.json"
        
        if not chunks_file.exists():
            logger.warning(f"Chunks file not found for doc {doc_id}")
            return []
        
        try:
            with open(chunks_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data.get("chunks", [])
        except Exception as e:
            logger.error(f"Failed to load chunks for doc {doc_id}: {str(e)}")
            return []