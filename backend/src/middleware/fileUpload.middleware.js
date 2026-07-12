/**
 * File Upload Middleware
 * Multer configuration and middleware
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
  MAX_TOTAL_UPLOAD_SIZE,
  generateStoredName,
  isFileTypeAllowed,
  isExtensionAllowed,
  ensureKnowledgeBaseDirectories,
} = require('../config/fileUpload');

/**
 * File filter for multer - Check both MIME type and extension
 */
const fileFilter = (req, file, cb) => {
  // Check MIME type
  const isMimeAllowed = isFileTypeAllowed(file.mimetype);
  
  // Check extension
  const isExtAllowed = isExtensionAllowed(file.originalname);
  
  if (isMimeAllowed || isExtAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.originalname} (${file.mimetype})`), false);
  }
};

/**
 * Configure multer storage
 */
const configureMulterStorage = (kbId) => {
  // Ensure directories exist
  const paths = ensureKnowledgeBaseDirectories(kbId);

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, paths.original);
    },
    filename: (req, file, cb) => {
      const storedName = generateStoredName(file.originalname);
      cb(null, storedName);
    },
  });
};

/**
 * Create multer upload instance for a specific knowledge base
 */
const createUploadInstance = (kbId) => {
  const storage = configureMulterStorage(kbId);

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: MAX_FILES_PER_UPLOAD,
      fieldSize: MAX_TOTAL_UPLOAD_SIZE, // Total upload size limit
    },
  });
};


/**
 * Upload middleware for multiple files
 * Usage: upload.array('files', 10)
 */
const uploadFiles = (kbId) => {
  const upload = createUploadInstance(kbId);
  return upload.array('files', MAX_FILES_PER_UPLOAD);
};

/**
 * Error handler for multer errors
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Too many files. Maximum is ${MAX_FILES_PER_UPLOAD}`,
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please use "files" as the field name',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

module.exports = {
  createUploadInstance,
  uploadFiles,
  handleMulterError,
};