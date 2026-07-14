/**
 * Document Service
 * Handles all document-related operations
 */
const { pool } = require('../config/db');
const DocumentModel = require('../models/document.model');
const knowledgeBaseService = require('./knowledgeBase.service');
const {
  getKnowledgeBaseStoragePath,
  ensureKnowledgeBaseDirectories,
} = require('../config/fileUpload');
const fileUtils = require('../utils/fileUtils');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { extractZip, cleanupTempDir } = require('../utils/zipUtils');
const aiService = require('./ai.service');



/**
 * Import documents from a ZIP file
 * @param {number} kbId - Knowledge base ID
 * @param {string} zipPath - Path to ZIP file
 * @param {number} userId - User ID (for ownership check)
 * @returns {Promise<Object>} - Import results
 */
/**
 * Import documents from a ZIP file
 */
const importFromZip = async (kbId, zipPath, userId) => {
  const kb = await knowledgeBaseService.getKnowledgeBaseById(kbId);
  if (!kb) {
    throw new Error('Knowledge base not found');
  }

  const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(kbId, userId);
  if (!isOwner) {
    throw new Error('You do not have access to this knowledge base');
  }

  const paths = ensureKnowledgeBaseDirectories(kbId);
  const tempDir = path.join(paths.base, 'temp_extract');
  
  // Clean up existing temp
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  console.log(`📦 Extracting ZIP to: ${tempDir}`);

  try {
    // Extract ZIP - this now waits for ALL files
    const result = await extractZip(zipPath, tempDir);
    
    if (result.extractedFiles.length === 0) {
      cleanupTempDir(tempDir);
      throw new Error('No valid files found in ZIP. Please ensure your ZIP contains supported file types (PDF, DOC, TXT, etc.)');
    }

    console.log(`📊 Extracted ${result.extractedFiles.length} files from ZIP`);

    const results = {
      uploaded: [],
      failed: [],
      total: result.extractedFiles.length,
    };

    // Process files
    for (const fileInfo of result.extractedFiles) {
      try {
        const ext = path.extname(fileInfo.fileName);
        const storedName = `${uuidv4()}_${Date.now()}${ext}`;
        const destPath = path.join(paths.original, storedName);

        // Move file from temp to final destination
        fs.renameSync(fileInfo.path, destPath);

        const docData = {
          kbId: kbId,
          originalName: path.basename(fileInfo.fileName),
          storedName: storedName,
          mimeType: fileInfo.mimeType || 'application/octet-stream',
          fileExtension: fileInfo.extension,
          size: fileInfo.size,
          path: destPath,
          status: 'UPLOADED',
          relativePath: fileInfo.relativePath,
          metadata: {
            uploadedAt: new Date().toISOString(),
            userId: userId,
            fileType: fileInfo.mimeType || 'application/octet-stream',
            originalPath: fileInfo.relativePath,
            importMethod: 'zip',
          },
        };

        const doc = await createDocument(docData);

        results.uploaded.push({
          fileName: path.basename(fileInfo.fileName),
          relativePath: fileInfo.relativePath,
          docId: doc.docId,
          status: 'UPLOADED',
          size: DocumentModel.formatSize(fileInfo.size),
        });
      } catch (error) {
        console.error(`Failed to process ${fileInfo.fileName}:`, error.message);
        results.failed.push({
          fileName: path.basename(fileInfo.fileName),
          relativePath: fileInfo.relativePath,
          reason: error.message,
        });
      }
    }

    // Clean up temp directory (ONLY after all files are processed)
    cleanupTempDir(tempDir);

    // Clean up ZIP file
    try {
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
        console.log(`🗑️ Deleted ZIP: ${zipPath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not delete ZIP:`, error.message);
    }

    return results;
  } catch (error) {
    // Clean up on error
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (err) {}
    throw error;
  }
};
/**
 * Upload multiple documents
 * @param {number} kbId - Knowledge base ID
 * @param {Array} files - Array of file objects from multer
 * @param {number} userId - User ID (for ownership check)
 * @returns {Promise<Object>} - Upload results
 */
const uploadDocuments = async (kbId, files, userId) => {
  // Check if knowledge base exists and belongs to user
  const kb = await knowledgeBaseService.getKnowledgeBaseById(kbId);
  if (!kb) {
    throw new Error('Knowledge base not found');
  }

  const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(kbId, userId);
  if (!isOwner) {
    throw new Error('You do not have access to this knowledge base');
  }

  // Ensure storage directories exist
  ensureKnowledgeBaseDirectories(kbId);

  const results = {
    uploaded: [],
    failed: [],
  };

  // Process each file
  for (const file of files) {
    try {
      // Get file details
      const originalName = file.originalname;
      const storedName = file.filename;
      const mimeType = file.mimetype;
      const fileExtension = path.extname(originalName).toLowerCase().slice(1);
      const size = file.size;
      const filePath = file.path;

      // Insert document record
      const docData = {
        kbId: kbId,
        originalName: originalName,
        storedName: storedName,
        mimeType: mimeType,
        fileExtension: fileExtension,
        size: size,
        path: filePath,
        status: 'UPLOADED',
        metadata: {
          uploadedAt: new Date().toISOString(),
          userId: userId,
          fileType: mimeType,
        },
      };

      const doc = await createDocument(docData);

      results.uploaded.push({
        fileName: originalName,
        docId: doc.docId,
        status: 'UPLOADED',
        size: DocumentModel.formatSize(size),
      });
    } catch (error) {
      // Clean up file if database insert fails
      try {
        fileUtils.deleteFile(file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }

      results.failed.push({
        fileName: file.originalname,
        reason: error.message,
      });
    }
  }

  return results;
};

/**
 * Create a document record with optional relative path
 * @param {Object} docData - Document data
 * @returns {Promise<Object>} - Created document
 */
const createDocument = async (docData) => {
  try {
    const dbData = DocumentModel.toDatabase(docData);

    // Ensure metadata is properly stringified
    let metadataValue = dbData.doc_metadata || '{}';
    if (typeof metadataValue === 'object') {
      metadataValue = JSON.stringify(metadataValue);
    }

    // Add relative_path if provided
    const relativePath = docData.relativePath || null;

    const [result] = await pool.query(
      `INSERT INTO dm_documents 
       (doc_kb_id, doc_original_name, doc_stored_name, doc_mime_type, 
        doc_file_extension, doc_size_in_bytes, doc_path, doc_status, 
        doc_metadata, doc_relative_path) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dbData.doc_kb_id,
        dbData.doc_original_name,
        dbData.doc_stored_name,
        dbData.doc_mime_type,
        dbData.doc_file_extension,
        dbData.doc_size_in_bytes,
        dbData.doc_path,
        dbData.doc_status || 'UPLOADED',
        metadataValue,
        relativePath,
      ]
    );

    const doc = await getDocumentById(result.insertId);
    return doc;
  } catch (error) {
    throw new Error(`Error creating document: ${error.message}`);
  }
};

/**
 * Get document by ID
 * @param {number} docId - Document ID
 * @returns {Promise<Object|null>} - Document or null
 */
const getDocumentById = async (docId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM dm_documents WHERE doc_id = ?',
      [docId]
    );

    if (rows.length === 0) {
      return null;
    }

    return DocumentModel.fromDatabase(rows[0]);
  } catch (error) {
    throw new Error(`Error fetching document: ${error.message}`);
  }
};

/**
 * Get all documents for a knowledge base
 * @param {number} kbId - Knowledge base ID
 * @param {Object} options - Options (status filter, pagination)
 * @returns {Promise<Object>} - Documents and pagination info
 */
const getDocumentsByKnowledgeBase = async (kbId, options = {}) => {
  try {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const status = options.status;

    let query = 'SELECT * FROM dm_documents WHERE doc_kb_id = ?';
    const params = [kbId];

    if (status) {
      query += ' AND doc_status = ?';
      params.push(status);
    }

    query += ' ORDER BY doc_createdAt DESC';

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Get paginated results
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    const documents = rows.map((row) => DocumentModel.fromDatabase(row));

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`Error fetching documents: ${error.message}`);
  }
};

/**
 * Update document status
 * @param {number} docId - Document ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated document
 */
const updateDocumentStatus = async (docId, status) => {
  try {
    const allowedStatuses = ['UPLOADED', 'INDEXING', 'INDEXED', 'FAILED'];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const [result] = await pool.query(
      'UPDATE dm_documents SET doc_status = ? WHERE doc_id = ?',
      [status, docId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Document not found');
    }

    const doc = await getDocumentById(docId);
    return doc;
  } catch (error) {
    throw new Error(`Error updating document status: ${error.message}`);
  }
};

/**
 * Delete a document
 * @param {number} docId - Document ID
 * @param {number} userId - User ID (for ownership check)
 * @returns {Promise<boolean>} - True if deleted
 */
const deleteDocument = async (docId, userId) => {
  try {
    // Get document
    const doc = await getDocumentById(docId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // Check knowledge base ownership
    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(doc.kbId, userId);
    if (!isOwner) {
      throw new Error('You do not have access to this document');
    }

    // Delete file from filesystem
    if (doc.path) {
      const fileDeleted = fileUtils.deleteFile(doc.path);
      if (!fileDeleted) {
        console.warn(`File not found for document ${docId}: ${doc.path}`);
      }
    }

    // Delete from database
    const [result] = await pool.query(
      'DELETE FROM dm_documents WHERE doc_id = ?',
      [docId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error deleting document: ${error.message}`);
  }
};

/**
 * Get document file path for download
 * @param {number} docId - Document ID
 * @param {number} userId - User ID (for ownership check)
 * @returns {Promise<Object>} - { path, originalName, mimeType }
 */
const getDocumentFilePath = async (docId, userId) => {
  try {
    const doc = await getDocumentById(docId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // Check knowledge base ownership
    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(doc.kbId, userId);
    if (!isOwner) {
      throw new Error('You do not have access to this document');
    }

    // Check if file exists
    if (!fileUtils.fileExists(doc.path)) {
      throw new Error('File not found on server');
    }

    return {
      path: doc.path,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
    };
  } catch (error) {
    throw new Error(`Error getting document file: ${error.message}`);
  }
};

/**
 * Get document statistics for a knowledge base
 * @param {number} kbId - Knowledge base ID
 * @returns {Promise<Object>} - Statistics
 */
const getDocumentStats = async (kbId) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN doc_status = 'UPLOADED' THEN 1 ELSE 0 END) as uploaded,
        SUM(CASE WHEN doc_status = 'INDEXING' THEN 1 ELSE 0 END) as indexing,
        SUM(CASE WHEN doc_status = 'INDEXED' THEN 1 ELSE 0 END) as indexed,
        SUM(CASE WHEN doc_status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(doc_size_in_bytes) as totalSize
       FROM dm_documents 
       WHERE doc_kb_id = ?`,
      [kbId]
    );

    const stats = rows[0];
    return {
      total: parseInt(stats.total) || 0,
      uploaded: parseInt(stats.uploaded) || 0,
      indexing: parseInt(stats.indexing) || 0,
      indexed: parseInt(stats.indexed) || 0,
      failed: parseInt(stats.failed) || 0,
      totalSize: parseInt(stats.totalSize) || 0,
      totalSizeFormatted: DocumentModel.formatSize(parseInt(stats.totalSize) || 0),
    };
  } catch (error) {
    throw new Error(`Error getting document stats: ${error.message}`);
  }
};

/**
 * Trigger AI processing for a document
 * @param {number} docId - Document ID
 * @param {number} kbId - Knowledge Base ID
 */
const triggerAIProcessing = async (docId, kbId) => {
  try {
    // First, update status to INDEXING
    await updateDocumentStatus(docId, 'INDEXING');
    
    // Then call AI service
    const result = await aiService.processDocument(docId, kbId);
    
    if (result.success) {
      // Status already updated to INDEXED by AI service
      console.log(`✅ Document ${docId} processed successfully`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ AI processing failed for doc ${docId}:`, error.message);
    // Update status to FAILED
    await updateDocumentStatus(docId, 'FAILED');
    throw error;
  }
};

module.exports = {
  uploadDocuments,
  createDocument,
  getDocumentById,
  getDocumentsByKnowledgeBase,
  updateDocumentStatus,
  deleteDocument,
  getDocumentFilePath,
  getDocumentStats,
  importFromZip,
  triggerAIProcessing,
};