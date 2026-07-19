"""
Document Processing Service - DEBUG VERSION
"""
import json as jsonlib
from pathlib import Path
from typing import Dict, Any
import logging
import httpx
import traceback

from app.core.config import settings
from app.parsers.factory import ParserFactory
from app.services.chunking_service import ChunkingService
from app.embeddings import embedding_service
from app.qdrant import indexing_service




logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Handles document processing"""
    
    def __init__(self):
        self.backend_api = settings.BACKEND_API_URL
        self.processed_path = Path(settings.STORAGE_PATH) / "processed"
        self.processed_path.mkdir(parents=True, exist_ok=True)

        # Initialize chunking service
        self.chunking_service = ChunkingService(use_langchain=True)



        logger.info(f"🔧 DocumentProcessor initialized")
        logger.info(f"   BACKEND_API_URL: {self.backend_api}")
        logger.info(f"   PROCESSED_PATH: {self.processed_path}")
    
    async def process_document(self, doc_id: int, kb_id: int) -> Dict[str, Any]:
        """Process a document: extract text and metadata"""
        logger.info(f"=" * 50)
        logger.info(f"📄 PROCESSING DOCUMENT")
        logger.info(f"   doc_id: {doc_id}")
        logger.info(f"   kb_id: {kb_id}")
        logger.info(f"=" * 50)
        
        try:
            # STEP 1: Get document info from backend
            logger.info(f"🔍 STEP 1: Getting document info from backend...")
            doc_info = await self._get_document_info(doc_id)
            
            if not doc_info:
                logger.error(f"❌ Document {doc_id} not found - doc_info is None")
                raise Exception(f"Document {doc_id} not found")
            
            logger.info(f"✅ Document info retrieved successfully")
            logger.info(f"   File: {doc_info.get('originalName', 'unknown')}")
            logger.info(f"   Path: {doc_info.get('path', 'unknown')}")
            logger.info(f"   Status: {doc_info.get('status', 'unknown')}")
            
            # STEP 2: Parse the document
            logger.info(f"🔍 STEP 2: Parsing document...")
            file_path = Path(doc_info['path'])
            logger.info(f"   File path: {file_path}")
            
            if not file_path.exists():
                logger.error(f"❌ File not found: {file_path}")
                raise FileNotFoundError(f"File not found: {file_path}")
            
            logger.info(f"   File exists: ✅")
            logger.info(f"   File size: {file_path.stat().st_size} bytes")
            
            logger.info(f"🔍 STEP 3: Creating parser...")
            parser = ParserFactory.get_parser(str(file_path))
            logger.info(f"   Parser type: {type(parser).__name__}")
            
            logger.info(f"🔍 STEP 4: Extracting text...")
            text = parser.extract_text()
            logger.info(f"   Text extracted: {len(text)} characters")
            
            logger.info(f"🔍 STEP 5: Extracting metadata...")
            metadata = parser.extract_metadata()
            logger.info(f"   Metadata extracted: {metadata}")
            
            logger.info(f"   ✅ Extracted {metadata.get('word_count', 0)} words, {metadata.get('page_count', 0)} pages")
            
            # STEP 3: Save processed text
            logger.info(f"🔍 STEP 6: Saving processed text...")
            text_file = self.processed_path / f"{doc_id}.txt"
            with open(text_file, 'w', encoding='utf-8') as f:
                f.write(text)
            logger.info(f"   ✅ Text saved to: {text_file}")
            
            # STEP 4: Save metadata
            logger.info(f"🔍 STEP 7: Saving metadata...")
            meta_file = self.processed_path / f"{doc_id}_metadata.json"
            with open(meta_file, 'w', encoding='utf-8') as f:
                jsonlib.dump(metadata, f, indent=2)
            logger.info(f"   ✅ Metadata saved to: {meta_file}")


            logger.info(f"🔍 STEP 8: Chunking text...")
            chunk_result = await self.chunking_service.chunk_document(doc_id, text)
            logger.info(f"   ✅ Generated {chunk_result['total_chunks']} chunks")


            # STEP 9: Generate Embeddings - NEW
            logger.info(f"🔍 STEP 9: Generating embeddings...")
            embedding_result = await embedding_service.generate_embeddings(
                doc_id=doc_id,
                chunks=chunk_result['chunks']
            )
            logger.info(f"   ✅ Generated {embedding_result['total_chunks']} embeddings")
            logger.info(f"   Dimension: {embedding_result['dimension']}")
            logger.info(f"   Validation: {embedding_result['validation']['status']}")


            # STEP 10: Index into Qdrant - NEW
            logger.info(f"🔍 STEP 10: Indexing into Qdrant...")

            # Get chunks and embeddings from saved files
            chunks = chunk_result['chunks']
            # Load embeddings from the saved file
            import json as jsonlib2
            with open(embedding_result['embeddings_file'], 'r') as f:
                embedding_data = jsonlib2.load(f)
                embeddings = [chunk['embedding'] for chunk in embedding_data['chunks']]

            # Index into Qdrant
            index_result = await indexing_service.index_document(
                doc_id=doc_id,
                kb_id=kb_id,
                chunks=chunks,
                embeddings=embeddings
            )
            logger.info(f"   ✅ Indexed {index_result['points_indexed']} points")


            # STEP 5: Update status in backend
            logger.info(f"🔍 STEP 11: Updating status to INDEXED...")
            status_updated = await self._update_document_status(doc_id, "INDEXED")
            if not status_updated:
                logger.warning(f"⚠️ Could not update status for doc {doc_id}")
            else:
                logger.info(f"   ✅ Status updated to INDEXED")
            
            result = {
                "doc_id": doc_id,
                "success": True,
                "word_count": metadata.get("word_count", 0),
                "page_count": metadata.get("page_count", 0),
                "text_length": len(text),
                "total_chunks": chunk_result['total_chunks'],
                "embedding_dimension": embedding_result['dimension'],
                "embedding_model": embedding_result['model_name'],
                "validation_status": embedding_result['validation']['status'],
                "qdrant_indexed": index_result['points_indexed'],
                "metadata": metadata,
                "chunks_preview": chunk_result['preview'],
            }
                        
            logger.info(f"🎉 Document {doc_id} processed successfully!")
            logger.info(f"   Total chunks: {chunk_result['total_chunks']}")
            logger.info(f"=" * 50)
            return result
            
        except Exception as e:
            logger.error(f"❌ FAILED: {str(e)}")
            logger.error(f"❌ Traceback:\n{traceback.format_exc()}")
            logger.info(f"🔍 STEP 9: Updating status to FAILED...")
            await self._update_document_status(doc_id, "FAILED")
            logger.info(f"=" * 50)
            raise
    
    async def _get_document_info(self, doc_id: int) -> Dict[str, Any]:
        """Fetch document info from backend"""
        url = f"{self.backend_api}/api/v1/documents/internal/{doc_id}"
        logger.info(f"   🌐 Calling backend: {url}")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"   📤 Sending GET request...")
                response = await client.get(url)
                logger.info(f"   📥 Response received")
                logger.info(f"   Status code: {response.status_code}")
                logger.info(f"   Response headers: {dict(response.headers)}")
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"   Response body (first 200 chars): {str(data)[:200]}...")
                    doc_data = data.get("data", {})
                    logger.info(f"   ✅ Document data retrieved")
                    return doc_data
                else:
                    logger.error(f"   ❌ Backend returned {response.status_code}")
                    logger.error(f"   Response body: {response.text}")
                    return None
                    
        except httpx.TimeoutException as e:
            logger.error(f"   ❌ Timeout connecting to backend: {str(e)}")
            return None
        except httpx.ConnectError as e:
            logger.error(f"   ❌ Cannot connect to backend: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"   ❌ Unexpected error: {str(e)}")
            logger.error(f"   Traceback: {traceback.format_exc()}")
            return None
    
    async def _update_document_status(self, doc_id: int, status: str) -> bool:
        """Update document status in backend"""
        url = f"{self.backend_api}/api/v1/documents/status/{doc_id}"
        logger.info(f"   🌐 Calling backend: {url}")
        logger.info(f"   📤 Sending PATCH with status: {status}")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.patch(url, json={"status": status})
                logger.info(f"   📥 Response received")
                logger.info(f"   Status code: {response.status_code}")
                
                if response.status_code == 200:
                    logger.info(f"   ✅ Status updated successfully")
                    return True
                else:
                    logger.error(f"   ❌ Status update failed: {response.status_code}")
                    logger.error(f"   Response body: {response.text}")
                    return False
                    
        except httpx.TimeoutException as e:
            logger.error(f"   ❌ Timeout updating status: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"   ❌ Error updating status: {str(e)}")
            logger.error(f"   Traceback: {traceback.format_exc()}")
            return False