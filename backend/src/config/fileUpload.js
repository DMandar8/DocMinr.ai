/**
 * File Upload Configuration
 * Multer configuration for document uploads
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('./env');

// Allowed file types - EXPANDED
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  
  // Text files
  'text/plain', // .txt
  'text/csv',
  'text/markdown',
  'text/html',
  'application/json',
  
  // Code files
  'text/x-sql', // .sql
  'text/x-python',
  'text/x-javascript',
  'text/x-java',
  'text/x-c',
  'text/x-cpp',
  'text/x-ruby',
  'text/x-go',
  'text/x-php',
  'text/x-rust',
  
  // Images
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/svg+xml',
  'image/tiff',
  'image/webp',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  
  // Package files
  'application/x-pkg', // .pkg
  'application/x-debian-package', // .deb
  'application/x-redhat-package-manager', // .rpm
  'application/vnd.apple.installer+xml', // .pkg (macOS)
  
  // Other
  'application/xml',
  'application/rtf',
  'application/vnd.oasis.opendocument.text', // .odt
  'application/vnd.oasis.opendocument.spreadsheet', // .ods
  'application/vnd.oasis.opendocument.presentation', // .odp
];

// Also check by extension (for cases where MIME type might not be recognized)
const ALLOWED_EXTENSIONS = [
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'odt', 'ods', 'odp', 'rtf',
  
  // Text
  'txt', 'csv', 'md', 'html', 'htm', 'json', 'xml',
  
  // Code
  'sql', 'py', 'js', 'java', 'c', 'cpp', 'rb', 'go', 'php', 'rs',
  
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'tiff', 'webp', 'ico',
  
  // Archives
  'zip', 'rar', '7z', 'tar', 'gz',
  
  // Packages
  'pkg', 'deb', 'rpm', 'dmg',
  
  // Others
  'log', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
];

// File size limit (50MB) - Keep as is
const MAX_FILE_SIZE = env.MAX_FILE_SIZE || 50 * 1024 * 1024;

// Maximum number of files per upload - We'll handle this differently
const MAX_FILES_PER_UPLOAD = env.MAX_FILES_PER_UPLOAD || 100; // Increased

// Maximum total upload size per request (500MB)
const MAX_TOTAL_UPLOAD_SIZE = env.MAX_TOTAL_UPLOAD_SIZE || 500 * 1024 * 1024;
/**
 * Generate a unique stored filename
 */
const generateStoredName = (originalName) => {
  const ext = path.extname(originalName);
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `${uuid}_${timestamp}${ext}`;
};

/**
 * Get file extension from original name
 */
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().slice(1);
};

/**
 * Get MIME type from file
 */
const getMimeType = (file) => {
  return file.mimetype;
};

/**
 * Check if file type is allowed by MIME type
 */
const isFileTypeAllowed = (mimeType) => {
  return ALLOWED_MIME_TYPES.includes(mimeType);
};

/**
 * Check if file extension is allowed
 */
const isExtensionAllowed = (filename) => {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
};

/**
 * Get file type category for display
 */
const getFileTypeCategory = (mimeType) => {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PowerPoint';
  if (mimeType.includes('text') || mimeType.includes('csv')) return 'Text';
  if (mimeType.includes('image')) return 'Image';
  if (mimeType.includes('json')) return 'JSON';
  return 'Unknown';
};

/**
 * Get file icon based on type (for frontend)
 */
const getFileIcon = (mimeType) => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation')) return '📑';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('text')) return '📃';
  return '📎';
};

/**
 * Format file size to human-readable format
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Ensure directory exists
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Get storage path for a knowledge base
 */
const getKnowledgeBaseStoragePath = (kbId) => {
  const basePath = env.STORAGE_PATH || path.join(process.cwd(), 'storage', 'knowledge-bases');
  return {
    base: path.join(basePath, String(kbId)),
    original: path.join(basePath, String(kbId), 'original'),
    processed: path.join(basePath, String(kbId), 'processed'),
  };
};

/**
 * Ensure knowledge base storage directories exist
 */
const ensureKnowledgeBaseDirectories = (kbId) => {
  const paths = getKnowledgeBaseStoragePath(kbId);
  ensureDirectoryExists(paths.base);
  ensureDirectoryExists(paths.original);
  ensureDirectoryExists(paths.processed);
  return paths;
};

module.exports = {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
  generateStoredName,
  getFileExtension,
  getMimeType,
  isFileTypeAllowed,
  getFileTypeCategory,
  getFileIcon,
  formatFileSize,
  ensureDirectoryExists,
  getKnowledgeBaseStoragePath,
  ensureKnowledgeBaseDirectories,
};