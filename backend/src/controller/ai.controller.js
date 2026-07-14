/**
 * AI Controller
 * Handles AI service integration
 */
const aiService = require('../services/ai.service');
const documentService = require('../services/document.service');
const knowledgeBaseService = require('../services/knowledgeBase.service');

/**
 * Trigger AI processing for a document
 * POST /api/v1/ai/process/:docId
 */
const triggerProcessing = async (req, res, next) => {
  try {
    const docId = parseInt(req.params.docId);
    const userId = req.user.userId;
    
    // Check document exists
    const doc = await documentService.getDocumentById(docId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Check ownership via knowledge base
    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(doc.kbId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    // Check if already indexed
    if (doc.status === 'INDEXED') {
      return res.status(400).json({
        success: false,
        message: 'Document is already indexed',
      });
    }
    
    // Update status to INDEXING
    await documentService.updateDocumentStatus(docId, 'INDEXING');
    
    // Trigger AI processing (async - don't wait for completion)
    aiService.processDocument(docId, doc.kbId)
      .then(result => {
        console.log(`✅ Document ${docId} processed successfully`);
      })
      .catch(error => {
        console.error(`❌ AI processing failed for doc ${docId}:`, error.message);
        documentService.updateDocumentStatus(docId, 'FAILED').catch(console.error);
      });
    
    res.status(202).json({
      success: true,
      message: 'AI processing triggered',
      data: {
        docId,
        status: 'INDEXING',
      },
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Check AI service health
 * GET /api/v1/ai/health
 */
const checkAIHealth = async (req, res, next) => {
  try {
    const healthy = await aiService.checkHealth();
    res.status(200).json({
      success: true,
      data: {
        healthy,
        service: 'AI Service',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI processing status for a document
 * GET /api/v1/ai/status/:docId
 */
const getProcessingStatus = async (req, res, next) => {
  try {
    const docId = parseInt(req.params.docId);
    const userId = req.user.userId;
    
    // Check document exists
    const doc = await documentService.getDocumentById(docId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Check ownership
    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(doc.kbId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        docId: doc.docId,
        status: doc.status,
        originalName: doc.originalName,
        processedAt: doc.updatedAt,
      },
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerProcessing,
  checkAIHealth,
  getProcessingStatus,
};