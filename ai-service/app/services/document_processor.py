"""
Document Processing Service
"""
import json
from pathlib import Path
from typing import Dict, Any
import logging
import httpx

from app.core.config import settings
from app.parsers.factory import ParserFactory

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Handles document processing"""
    
    def __init__(self):
        self.backend_api = settings.BACKEND_API_URL
        self.processed_path = Path(settings.STORAGE_PATH) / "processed"
        self.processed_path.mkdir(parents=True, exist_ok=True)
    
    async def process_document(self, doc_id: int, kb_id: int) -> Dict[str, Any]:
        """Process a document: extract text and metadata"""
        logger.info(f"📄 Processing doc {doc_id} from KB {kb_id}")
        
        try:
            # 1. Get document info from backend
            doc_info = await self._get_document_info(doc_id)
            if not doc_info:
                raise Exception(f"Document {doc_id} not found")
            
            logger.info(f"   File: {doc_info['originalName']}")
            
            # 2. Parse the document
            file_path = Path(doc_info['path'])
            parser = ParserFactory.get_parser(str(file_path))
            
            text = parser.extract_text()
            metadata = parser.extract_metadata()
            
            logger.info(f"   Extracted {metadata['word_count']} words, {metadata['page_count']} pages")
            
            # 3. Save processed text
            text_file = self.processed_path / f"{doc_id}.txt"
            with open(text_file, 'w', encoding='utf-8') as f:
                f.write(text)
            
            # 4. Save metadata
            meta_file = self.processed_path / f"{doc_id}_metadata.json"
            with open(meta_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2)
            
            # 5. Update status in backend
            await self._update_document_status(doc_id, "INDEXED")
            
            return {
                "doc_id": doc_id,
                "success": True,
                "word_count": metadata.get("word_count", 0),
                "page_count": metadata.get("page_count", 0),
                "text_length": len(text),
                "metadata": metadata,
            }
            
        except Exception as e:
            logger.error(f"❌ Failed: {str(e)}")
            await self._update_document_status(doc_id, "FAILED")
            raise
    
    async def _get_document_info(self, doc_id: int) -> Dict[str, Any]:
        """Fetch document info from backend"""
        try:
            url = f"{self.backend_api}/api/v1/documents/internal/{doc_id}"
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return response.json().get("data", {})
                return None
        except Exception as e:
            logger.error(f"Failed to fetch doc: {str(e)}")
            return None
    
    async def _update_document_status(self, doc_id: int, status: str) -> bool:
        """Update document status in backend"""
        try:
            url = f"{self.backend_api}/api/v1/documents/status/{doc_id}"
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.patch(url, json={"status": status})
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Failed to update status: {str(e)}")
            return False