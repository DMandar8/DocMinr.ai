/**
 * AI Service Routes
 * Handles communication with the AI microservice
 */
const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
// const aiController = require('../controller/ai.controller');
const {
  triggerProcessing,
  checkAIHealth,
  getProcessingStatus,
} = require('../controller/ai.controller');

const router = express.Router();

// ============================================
// Protected Routes (Require Authentication)
// ============================================
router.use(authenticate);

/**
 * @route   POST /api/v1/ai/process/:docId
 * @desc    Trigger AI processing for a document
 * @access  Private
 * @param   { docId } - Document ID
 * @returns {Object} - Processing status
 */
router.post('/process/:docId', triggerProcessing);

/**
 * @route   GET /api/v1/ai/health
 * @desc    Check AI service health
 * @access  Private
 * @returns {Object} - AI service health status
 */
router.get('/health', checkAIHealth);

/**
 * @route   GET /api/v1/ai/status/:docId
 * @desc    Get AI processing status for a document
 * @access  Private
 * @param   { docId } - Document ID
 * @returns {Object} - Processing status
 */
router.get('/status/:docId', getProcessingStatus);

module.exports = router;