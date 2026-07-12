/**
 * Knowledge Base Controller
 * Handles HTTP requests for knowledge base operations
 */
const knowledgeBaseService = require('../services/knowledgeBase.service');
const {
  validateCreateKnowledgeBase,
  validateUpdateKnowledgeBase,
  validateIdParam,
} = require('../validations/knowledgeBase.validation');

/**
 * Create a new knowledge base
 * POST /api/v1/knowledge-bases
 */
const createKnowledgeBase = async (req, res, next) => {
  try {
    // Validate request body
    const validation = validateCreateKnowledgeBase(req.body);
    if (!validation.valid) {
      const error = new Error('Validation Error');
      error.statusCode = 400;
      error.details = validation.errors;
      throw error;
    }

    // Get user ID from authenticated request
    const userId = req.user.userId;

    // Create knowledge base
    const kb = await knowledgeBaseService.createKnowledgeBase({
      userId,
      ...validation.data,
    });

    res.status(201).json({
      success: true,
      message: 'Knowledge base created successfully',
      data: {
        knowledgeBase: kb,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all knowledge bases for current user
 * GET /api/v1/knowledge-bases
 */
const getKnowledgeBases = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    

    const result = await knowledgeBaseService.getKnowledgeBasesByUser(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single knowledge base by ID
 * GET /api/v1/knowledge-bases/:id
 */
const getKnowledgeBase = async (req, res, next) => {
  try {

    // Validate ID param
    const validation = validateIdParam(req.params);
    if (!validation.valid) {
      const error = new Error('Validation Error');
      error.statusCode = 400;
      error.details = validation.errors;
      throw error;
    }

    const kbId = validation.data.id;
    const userId = req.user.userId;

    // Get knowledge base
    const kb = await knowledgeBaseService.getKnowledgeBaseById(kbId);
    if (!kb) {
      const error = new Error('Knowledge base not found');
      error.statusCode = 404;
      throw error;
    }

    // Check ownership
    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(kbId, userId);
    if (!isOwner) {
      const error = new Error('You do not have access to this knowledge base');
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        knowledgeBase: kb,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a knowledge base
 * PUT /api/v1/knowledge-bases/:id
 */
const updateKnowledgeBase = async (req, res, next) => {
  try {
    // Validate ID param
    const idValidation = validateIdParam(req.params);
    if (!idValidation.valid) {
      const error = new Error('Validation Error');
      error.statusCode = 400;
      error.details = idValidation.errors;
      throw error;
    }

    const kbId = idValidation.data.id;
    const userId = req.user.userId;

    // Validate request body
    const bodyValidation = validateUpdateKnowledgeBase(req.body);
    if (!bodyValidation.valid) {
      const error = new Error('Validation Error');
      error.statusCode = 400;
      error.details = bodyValidation.errors;
      throw error;
    }

    // Check ownership
    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(kbId, userId);
    if (!isOwner) {
      const error = new Error('You do not have access to this knowledge base');
      error.statusCode = 403;
      throw error;
    }

    // Update knowledge base
    const updatedKb = await knowledgeBaseService.updateKnowledgeBase(
      kbId,
      bodyValidation.data
    );

    res.status(200).json({
      success: true,
      message: 'Knowledge base updated successfully',
      data: {
        knowledgeBase: updatedKb,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a knowledge base
 * DELETE /api/v1/knowledge-bases/:id
 */
const deleteKnowledgeBase = async (req, res, next) => {
  try {
    // Validate ID param
    const validation = validateIdParam(req.params);
    if (!validation.valid) {
      const error = new Error('Validation Error');
      error.statusCode = 400;
      error.details = validation.errors;
      throw error;
    }

    const kbId = validation.data.id;
    const userId = req.user.userId;

    // Check ownership
    const isOwner = await knowledgeBaseService.isKnowledgeBaseOwner(kbId, userId);
    if (!isOwner) {
      const error = new Error('You do not have access to this knowledge base');
      error.statusCode = 403;
      throw error;
    }

    // Delete knowledge base
    await knowledgeBaseService.deleteKnowledgeBase(kbId);

    res.status(200).json({
      success: true,
      message: 'Knowledge base deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createKnowledgeBase,
  getKnowledgeBases,
  getKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
};