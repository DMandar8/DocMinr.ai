/**
 * Document Controller
 * Handles HTTP requests for document operations
 */
const documentService = require('../services/document.service');
const knowledgeBaseService = require('../services/knowledgeBase.service');
const { uploadFiles, handleMulterError } = require('../middleware/fileUpload.middleware');
const fileUtils = require('../utils/fileUtils');
const path = require('path');

/**
 * Upload documents to a knowledge base
 * POST /api/v1/documents/upload/:kbId
 */
const uploadDocuments = async (req, res, next) => {
  try {
    const kbId = parseInt(req.params.kbId);
    const userId = req.user.userId;

    // Check if knowledge base exists and belongs to user
    const kb = await knowledgeBaseService.getKnowledgeBaseById(kbId);
    if (!kb) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge base not found',
      });
    }

    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(kbId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this knowledge base',
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    // Upload documents
    const results = await documentService.uploadDocuments(kbId, req.files, userId);

    res.status(201).json({
      success: true,
      message: 'Upload completed',
      data: {
        uploaded: results.uploaded,
        failed: results.failed,
        totalUploaded: results.uploaded.length,
        totalFailed: results.failed.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all documents for a knowledge base
 * GET /api/v1/documents/:kbId
 */
const getDocuments = async (req, res, next) => {
  try {
    const kbId = parseInt(req.params.kbId);
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    // Check knowledge base ownership
    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(kbId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this knowledge base',
      });
    }

    // Get documents
    const result = await documentService.getDocumentsByKnowledgeBase(kbId, {
      status,
    });

    // Get statistics
    const stats = await documentService.getDocumentStats(kbId);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document
 * DELETE /api/v1/documents/:docId
 */
const deleteDocument = async (req, res, next) => {
  try {
    const docId = parseInt(req.params.docId);
    const userId = req.user.userId;

    const deleted = await documentService.deleteDocument(docId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download a document
 * GET /api/v1/documents/download/:docId
 */
const downloadDocument = async (req, res, next) => {
  try {
    const docId = parseInt(req.params.docId);
    const userId = req.user.userId;

    // Get file information
    const fileInfo = await documentService.getDocumentFilePath(docId, userId);

    // Send file for download
    res.download(fileInfo.path, fileInfo.originalName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading file',
          });
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get document statistics
 * GET /api/v1/documents/stats/:kbId
 */
const getDocumentStats = async (req, res, next) => {
  try {
    const kbId = parseInt(req.params.kbId);
    const userId = req.user.userId;

    // Check knowledge base ownership
    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(kbId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this knowledge base',
      });
    }

    const stats = await documentService.getDocumentStats(kbId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update document status (for internal use)
 * PATCH /api/v1/documents/status/:docId
 */
const updateDocumentStatus = async (req, res, next) => {
  try {
    const docId = parseInt(req.params.docId);
    const { status } = req.body;
    const userId = req.user.userId;

    // Check document ownership
    const doc = await documentService.getDocumentById(docId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(doc.kbId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this document',
      });
    }

    // Update status
    const updatedDoc = await documentService.updateDocumentStatus(docId, status);

    res.status(200).json({
      success: true,
      message: 'Document status updated',
      data: updatedDoc,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Import documents from ZIP file
 * POST /api/v1/documents/import/zip/:kbId
 */
const importFromZip = async (req, res, next) => {
  try {
    const kbId = parseInt(req.params.kbId);
    const userId = req.user.userId;

    // Check if knowledge base exists and belongs to user
    const kb = await knowledgeBaseService.getKnowledgeBaseById(kbId);
    if (!kb) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge base not found',
      });
    }

    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(kbId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this knowledge base',
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No ZIP file uploaded',
      });
    }

    // Validate file type (must be ZIP)
    const allowedZipTypes = ['application/zip', 'application/x-zip-compressed'];
    if (!allowedZipTypes.includes(req.file.mimetype) && 
        !req.file.originalname.toLowerCase().endsWith('.zip')) {
      return res.status(400).json({
        success: false,
        message: 'Only ZIP files are supported',
      });
    }

    // Import from ZIP
    const results = await documentService.importFromZip(
      kbId,
      req.file.path,
      userId
    );

    res.status(201).json({
      success: true,
      message: 'ZIP import completed',
      data: {
        uploaded: results.uploaded,
        failed: results.failed,
        totalUploaded: results.uploaded.length,
        totalFailed: results.failed.length,
        totalFiles: results.total,
      },
    });
  } catch (error) {
    next(error);
  }
};




module.exports = {
  uploadDocuments,
  getDocuments,
  deleteDocument,
  downloadDocument,
  getDocumentStats,
  updateDocumentStatus,
  importFromZip,
};