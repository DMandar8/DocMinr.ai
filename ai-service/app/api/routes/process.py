"""
Document Processing Routes
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import logging

from app.services.document_processor import DocumentProcessor

logger = logging.getLogger(__name__)
router = APIRouter()
processor = DocumentProcessor()

class ProcessRequest(BaseModel):
    doc_id: int
    kb_id: int

@router.post("/process")
async def process_document(request: ProcessRequest):
    """Process a document: extract text and metadata"""
    logger.info(f"📨 Process request: doc_id={request.doc_id}, kb_id={request.kb_id}")
    
    try:
        result = await processor.process_document(
            doc_id=request.doc_id,
            kb_id=request.kb_id
        )
        
        return {
            "success": True,
            "doc_id": request.doc_id,
            "message": "Document processed successfully",
            "data": result
        }
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))