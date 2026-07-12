/**
 * Document Model
 * Maps database columns to application fields
 */
class DocumentModel {
  /**
   * Map database row to application object
   */
  static fromDatabase(row) {
    if (!row) return null;

    // Handle metadata safely - MySQL JSON type already returns parsed object
    let metadata = null;
    if (row.doc_metadata) {
      // If it's already an object (MySQL JSON type), use it directly
      if (typeof row.doc_metadata === 'object') {
        metadata = row.doc_metadata;
      } else if (typeof row.doc_metadata === 'string') {
        // If it's a string (just in case), try to parse it
        try {
          metadata = JSON.parse(row.doc_metadata);
        } catch (e) {
          // If parsing fails, keep as string or null
          metadata = row.doc_metadata;
        }
      }
    }

    return {
      docId: row.doc_id,
      kbId: row.doc_kb_id,
      originalName: row.doc_original_name,
      storedName: row.doc_stored_name,
      mimeType: row.doc_mime_type,
      fileExtension: row.doc_file_extension,
      size: row.doc_size_in_bytes,
      sizeFormatted: this.formatSize(row.doc_size_in_bytes),
      path: row.doc_path,
      relativePath: row.doc_relative_path, 
      status: row.doc_status,
      metadata: metadata,
      createdAt: row.doc_createdAt,
      updatedAt: row.doc_updatedAt,
    };
  }

  /**
   * Map application object to database columns
   */
  static toDatabase(doc) {
    const dbObj = {};

    if (doc.kbId !== undefined) dbObj.doc_kb_id = doc.kbId;
    if (doc.originalName !== undefined) dbObj.doc_original_name = doc.originalName;
    if (doc.storedName !== undefined) dbObj.doc_stored_name = doc.storedName;
    if (doc.mimeType !== undefined) dbObj.doc_mime_type = doc.mimeType;
    if (doc.fileExtension !== undefined) dbObj.doc_file_extension = doc.fileExtension;
    if (doc.size !== undefined) dbObj.doc_size_in_bytes = doc.size;
    if (doc.path !== undefined) dbObj.doc_path = doc.path;
    if (doc.relativePath !== undefined) dbObj.doc_relative_path = doc.relativePath;
    if (doc.status !== undefined) dbObj.doc_status = doc.status;
    if (doc.metadata !== undefined) {
      // If metadata is an object, stringify it; if it's a string, use as-is
      if (typeof doc.metadata === 'object') {
        dbObj.doc_metadata = JSON.stringify(doc.metadata);
      } else {
        dbObj.doc_metadata = doc.metadata;
      }
    }

    return dbObj;
  }

  /**
   * Format file size to human-readable format
   */
  static formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get schema definition
   */
  static getSchema() {
    return {
      tableName: 'dm_documents',
      columns: {
        docId: 'doc_id',
        kbId: 'doc_kb_id',
        originalName: 'doc_original_name',
        storedName: 'doc_stored_name',
        mimeType: 'doc_mime_type',
        fileExtension: 'doc_file_extension',
        size: 'doc_size_in_bytes',
        path: 'doc_path',
        status: 'doc_status',
        metadata: 'doc_metadata',
        createdAt: 'doc_createdAt',
        updatedAt: 'doc_updatedAt',
      },
    };
  }

  /**
   * Get status badge color
   */
  static getStatusColor(status) {
    const colors = {
      'UPLOADED': 'yellow',
      'INDEXING': 'blue',
      'INDEXED': 'green',
      'FAILED': 'red',
    };
    return colors[status] || 'gray';
  }

  /**
   * Get status label
   */
  static getStatusLabel(status) {
    const labels = {
      'UPLOADED': 'Uploaded',
      'INDEXING': 'Indexing...',
      'INDEXED': 'Indexed',
      'FAILED': 'Failed',
    };
    return labels[status] || status;
  }
}

module.exports = DocumentModel;