"""
Document Processing Routes - DEBUG VERSION
"""
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, Field
import logging
import traceback

from app.services.document_processor import DocumentProcessor

logger = logging.getLogger(__name__)
router = APIRouter()
processor = DocumentProcessor()

class ProcessRequest(BaseModel):
    doc_id: int = Field(..., description="Document ID to process")
    kb_id: int = Field(..., description="Knowledge Base ID")

@router.post("/process")
async def process_document(request: ProcessRequest):
    """Process a document: extract text and metadata"""
    logger.info("=" * 60)
    logger.info(f"📨 RECEIVED PROCESS REQUEST")
    logger.info(f"   doc_id: {request.doc_id}")
    logger.info(f"   kb_id: {request.kb_id}")
    logger.info("=" * 60)
    
    try:
        logger.info("🔄 Calling DocumentProcessor.process_document()...")
        result = await processor.process_document(
            doc_id=request.doc_id,
            kb_id=request.kb_id
        )
        
        logger.info("✅ Processing successful, returning response")
        response = {
            "success": True,
            "doc_id": request.doc_id,
            "message": "Document processed successfully",
            "data": result
        }
        logger.info(f"📤 Response: {str(response)[:200]}...")
        return response
        
    except FileNotFoundError as e:
        logger.error(f"❌ FileNotFoundError: {str(e)}")
        logger.error(f"   Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        logger.error(f"❌ ValueError: {str(e)}")
        logger.error(f"   Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        logger.error(f"   Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

