/**
 * Knowledge Base Service
 * Handles all knowledge base operations
 * Uses dm_knowledge_base table
 */
const { pool } = require('../config/db');
const KnowledgeBaseModel = require('../models/knowledgeBase.model');

/**
 * Create a new knowledge base
 * @param {Object} kbData - Knowledge base data
 * @param {number} kbData.userId - User ID (owner)
 * @param {string} kbData.name - Knowledge base name
 * @param {string} kbData.description - Knowledge base description
 * @returns {Promise<Object>} - Created knowledge base
 */
const createKnowledgeBase = async (kbData) => {
  try {
    const dbData = KnowledgeBaseModel.toDatabase({
      userId: kbData.userId,
      name: kbData.name,
      description: kbData.description || '',
    });

    const [result] = await pool.query(
      `INSERT INTO dm_knowledge_base 
       (kb_user_id, kb_name, kb_description) 
       VALUES (?, ?, ?)`,
      [dbData.kb_user_id, dbData.kb_name, dbData.kb_description]
    );

    const kb = await getKnowledgeBaseById(result.insertId);
    return kb;
  } catch (error) {
  
    throw new Error(`Error creating knowledge base: ${error.message}`);
  }
};

/**
 * Get knowledge base by ID
 * @param {number} kbId - Knowledge base ID
 * @returns {Promise<Object|null>} - Knowledge base or null
 */
const getKnowledgeBaseById = async (kbId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM dm_knowledge_base WHERE kb_id = ?',
      [kbId]
    );

    if (rows.length === 0) {
      return null;
    }

    return KnowledgeBaseModel.fromDatabase(rows[0]);
  } catch (error) {
    throw new Error(`Error fetching knowledge base: ${error.message}`);
  }
};

/**
 * Get all knowledge bases for a user
 * @param {number} userId - User ID
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (starts from 1)
 * @param {number} options.limit - Items per page
 * @returns {Promise<Object>} - Knowledge bases and pagination info
 */
const getKnowledgeBasesByUser = async (userId) => {
  try {
    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM dm_knowledge_base WHERE kb_user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    // Get paginated results
    const [rows] = await pool.query(
      `SELECT * FROM dm_knowledge_base 
       WHERE kb_user_id = ? 
       ORDER BY kb_createdAt DESC`,
      [userId]
    );

    const knowledgeBases = rows.map((row) => KnowledgeBaseModel.fromDatabase(row));

    return {
      knowledgeBases,
      pagination: {
        total,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching knowledge bases: ${error.message}`);
  }
};

/**
 * Update a knowledge base
 * @param {number} kbId - Knowledge base ID
 * @param {Object} kbData - Data to update
 * @returns {Promise<Object>} - Updated knowledge base
 */
const updateKnowledgeBase = async (kbId, kbData) => {
  try {
    // Check if knowledge base exists
    const existing = await getKnowledgeBaseById(kbId);
    if (!existing) {
      throw new Error('Knowledge base not found');
    }

    // Build update query
    const dbData = KnowledgeBaseModel.toDatabase(kbData);
    const fields = [];
    const values = [];

    Object.keys(dbData).forEach((key) => {
      if (dbData[key] !== undefined && key !== 'kb_id') {
        fields.push(`${key} = ?`);
        values.push(dbData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(kbId);

    const [result] = await pool.query(
      `UPDATE dm_knowledge_base SET ${fields.join(', ')} WHERE kb_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error('Knowledge base not found or no changes made');
    }

    const updated = await getKnowledgeBaseById(kbId);
    return updated;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Knowledge base with this description already exists');
    }
    throw new Error(`Error updating knowledge base: ${error.message}`);
  }
};

/**
 * Delete a knowledge base
 * @param {number} kbId - Knowledge base ID
 * @returns {Promise<boolean>} - True if deleted
 */
const deleteKnowledgeBase = async (kbId) => {
  try {
    // Check if knowledge base exists
    const existing = await getKnowledgeBaseById(kbId);
    if (!existing) {
      throw new Error('Knowledge base not found');
    }

    // Note: For now, we don't delete associated documents/vectors
    // We'll handle cascading in later sprints

    const [result] = await pool.query(
      'DELETE FROM dm_knowledge_base WHERE kb_id = ?',
      [kbId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error deleting knowledge base: ${error.message}`);
  }
};

/**
 * Check if a knowledge base belongs to a user
 * @param {number} kbId - Knowledge base ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if belongs to user
 */
const isKnowledgeBaseOwner = async (kbId, userId) => {
  try {
    const [rows] = await pool.query(
      'SELECT kb_id FROM dm_knowledge_base WHERE kb_id = ? AND kb_user_id = ?',
      [kbId, userId]
    );
    return rows.length > 0;
  } catch (error) {
    throw new Error(`Error checking ownership: ${error.message}`);
  }
};

/**
 * Get count of knowledge bases for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} - Count of knowledge bases
 */
const countKnowledgeBasesByUser = async (userId) => {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM dm_knowledge_base WHERE kb_user_id = ?',
      [userId]
    );
    return rows[0].count;
  } catch (error) {
    throw new Error(`Error counting knowledge bases: ${error.message}`);
  }
};

module.exports = {
  createKnowledgeBase,
  getKnowledgeBaseById,
  getKnowledgeBasesByUser,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  isKnowledgeBaseOwner,
  countKnowledgeBasesByUser,
};