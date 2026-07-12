/**
 * Knowledge Base Validation Schemas
 * Uses Zod for input validation
 */
const { z } = require('zod');

/**
 * Create knowledge base validation schema
 */
const createKnowledgeBaseSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be at most 255 characters')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Name contains invalid characters'),
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(255, 'Description must be at most 255 characters')
    .trim()
    .optional()
    .default(''),
});

/**
 * Update knowledge base validation schema
 * All fields are optional for updates
 */
const updateKnowledgeBaseSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be at most 255 characters')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Name contains invalid characters')
    .optional(),
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(255, 'Description must be at most 255 characters')
    .trim()
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

/**
 * ID param validation
 */
const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID must be a valid number')
    .transform(Number),
});

/**
 * Validate create knowledge base data
 */
const validateCreateKnowledgeBase = (data) => {
  try {
    const validated = createKnowledgeBaseSchema.parse(data);
    return { valid: true, data: validated, errors: null };
  } catch (error) {
    if (error.errors) {
      const errors = error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      return { valid: false, data: null, errors };
    }
    return { valid: false, data: null, errors: [{ message: error.message }] };
  }
};

/**
 * Validate update knowledge base data
 */
const validateUpdateKnowledgeBase = (data) => {
  try {
    const validated = updateKnowledgeBaseSchema.parse(data);
    return { valid: true, data: validated, errors: null };
  } catch (error) {
    if (error.errors) {
      const errors = error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      return { valid: false, data: null, errors };
    }
    return { valid: false, data: null, errors: [{ message: error.message }] };
  }
};

/**
 * Validate ID param
 */
const validateIdParam = (data) => {
  try {
    const validated = idParamSchema.parse(data);
    return { valid: true, data: validated, errors: null };
  } catch (error) {
    if (error.errors) {
      const errors = error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      return { valid: false, data: null, errors };
    }
    return { valid: false, data: null, errors: [{ message: error.message }] };
  }
};

module.exports = {
  createKnowledgeBaseSchema,
  updateKnowledgeBaseSchema,
  idParamSchema,
  validateCreateKnowledgeBase,
  validateUpdateKnowledgeBase,
  validateIdParam,
};