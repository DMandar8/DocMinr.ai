/**
 * Knowledge Base Routes
 * All knowledge base-related endpoints
 */
const express = require('express');
const {
  createKnowledgeBase,
  getKnowledgeBases,
  getKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
} = require('../controller/knowledgeBase.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All knowledge base routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/knowledge-bases
 * @desc    Create a new knowledge base
 * @access  Private
 * @body    { name, description }
 */
router.post('/', createKnowledgeBase);

/**
 * @route   GET /api/v1/knowledge-bases
 * @desc    Get all knowledge bases for current user
 * @access  Private
 * @query   { page, limit }
 */
router.get('/', getKnowledgeBases);

/**
 * @route   GET /api/v1/knowledge-bases/:id
 * @desc    Get a single knowledge base by ID
 * @access  Private
 * @param   { id } - Knowledge base ID
 */
router.get('/:id', getKnowledgeBase);

/**
 * @route   PUT /api/v1/knowledge-bases/:id
 * @desc    Update a knowledge base
 * @access  Private
 * @param   { id } - Knowledge base ID
 * @body    { name, description }
 */
router.put('/:id', updateKnowledgeBase);

/**
 * @route   DELETE /api/v1/knowledge-bases/:id
 * @desc    Delete a knowledge base
 * @access  Private
 * @param   { id } - Knowledge base ID
 */
router.delete('/:id', deleteKnowledgeBase);

module.exports = router;