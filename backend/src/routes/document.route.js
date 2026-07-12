/**
 * Document Routes
 * All document-related endpoints
 */
const express = require('express');
const {
  uploadDocuments,
  getDocuments,
  deleteDocument,
  downloadDocument,
  getDocumentStats,
  updateDocumentStatus,
  importFromZip,
} = require('../controller/document.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadFiles, handleMulterError } = require('../middleware/fileUpload.middleware');

const router = express.Router();

// All document routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/documents/upload/:kbId
 * @desc    Upload documents to a knowledge base
 * @access  Private
 * @param   { kbId } - Knowledge base ID
 * @body    { files } - Multipart form data with 'files' field
 */
router.post(
  '/upload/:kbId',
  (req, res, next) => {
    // Dynamic upload middleware based on kbId
    const upload = uploadFiles(req.params.kbId);
    upload(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  uploadDocuments
);


/**
 * @route   POST /api/v1/documents/import/zip/:kbId
 * @desc    Import documents from a ZIP file
 * @access  Private
 * @param   { kbId } - Knowledge base ID
 * @body    { file } - ZIP file (multipart form-data)
 */
router.post(
  '/import/zip/:kbId',
  (req, res, next) => {
    // Use multer for single file upload (ZIP)
    const upload = require('multer')({
      dest: 'temp/uploads/',
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max
      },
      fileFilter: (req, file, cb) => {
        if (file.originalname.toLowerCase().endsWith('.zip')) {
          cb(null, true);
        } else {
          cb(new Error('Only ZIP files are allowed'), false);
        }
      },
    }).single('file');

    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
      }
      next();
    });
  },
  importFromZip
);



/**
 * @route   GET /api/v1/documents/:kbId
 * @desc    Get all documents for a knowledge base
 * @access  Private
 * @param   { kbId } - Knowledge base ID
 * @query   { page, limit, status }
 */
router.get('/:kbId', getDocuments);

/**
 * @route   GET /api/v1/documents/stats/:kbId
 * @desc    Get document statistics for a knowledge base
 * @access  Private
 * @param   { kbId } - Knowledge base ID
 */
router.get('/stats/:kbId', getDocumentStats);

/**
 * @route   GET /api/v1/documents/download/:docId
 * @desc    Download a document
 * @access  Private
 * @param   { docId } - Document ID
 */
router.get('/download/:docId', downloadDocument);

/**
 * @route   DELETE /api/v1/documents/:docId
 * @desc    Delete a document
 * @access  Private
 * @param   { docId } - Document ID
 */
router.delete('/:docId', deleteDocument);

/**
 * @route   PATCH /api/v1/documents/status/:docId
 * @desc    Update document status (internal use)
 * @access  Private
 * @param   { docId } - Document ID
 * @body    { status }
 */
router.patch('/status/:docId', updateDocumentStatus);

module.exports = router;