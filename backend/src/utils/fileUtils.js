/**
 * File Utilities
 * Helper functions for file operations
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Check if a file exists
 */
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

/**
 * Delete a file from the filesystem
 */
const deleteFile = (filePath) => {
  try {
    if (fileExists(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Get file size in bytes
 */
const getFileSize = (filePath) => {
  try {
    if (fileExists(filePath)) {
      const stats = fs.statSync(filePath);
      return stats.size;
    }
    return 0;
  } catch (error) {
    throw new Error(`Failed to get file size: ${error.message}`);
  }
};

/**
 * Read file as buffer
 */
const readFileAsBuffer = (filePath) => {
  try {
    if (fileExists(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
};

/**
 * Generate file checksum (SHA-256)
 */
const generateChecksum = (filePath) => {
  try {
    if (!fileExists(filePath)) {
      return null;
    }
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    throw new Error(`Failed to generate checksum: ${error.message}`);
  }
};

/**
 * Get file extension
 */
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().slice(1);
};

/**
 * Get file name without extension
 */
const getFileNameWithoutExtension = (filename) => {
  return path.basename(filename, path.extname(filename));
};

/**
 * Sanitize filename (remove special characters)
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9\-_. ]/g, '_');
};

/**
 * Create a download response object
 */
const createDownloadResponse = (filePath, originalName) => {
  return {
    path: filePath,
    name: originalName,
    contentType: getContentType(filePath),
  };
};

/**
 * Get content type from file extension
 */
const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.csv': 'text/csv',
    '.json': 'application/json',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

module.exports = {
  fileExists,
  deleteFile,
  getFileSize,
  readFileAsBuffer,
  generateChecksum,
  getFileExtension,
  getFileNameWithoutExtension,
  sanitizeFilename,
  createDownloadResponse,
  getContentType,
};