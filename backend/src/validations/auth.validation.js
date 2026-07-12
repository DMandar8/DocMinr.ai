/**
 * Auth Validation Schemas
 * Uses Zod for input validation
 */
const { z } = require('zod');

/**
 * Register validation schema
 */
const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .regex(/^[a-zA-Z\s-]+$/, 'First name can only contain letters, spaces, and hyphens')
    .trim()
    .transform((val) => val.replace(/\s+/g, ' ')), // Normalize spaces
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-Z\s-]+$/, 'Last name can only contain letters, spaces, and hyphens')
    .trim()
    .transform((val) => val.replace(/\s+/g, ' ')), // Normalize spaces
  email: z
    .string()
    .email('Please provide a valid email address')
    .max(255, 'Email must be at most 255 characters')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z
    .string()
    .min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * Login validation schema
 */
const loginSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .max(255, 'Email must be at most 255 characters')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

/**
 * Email validation schema (for password reset, etc.)
 */
const emailSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
});

/**
 * Validate registration data
 */
const validateRegister = (data) => {
  try {
    const validated = registerSchema.parse(data);
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
 * Validate login data
 */
const validateLogin = (data) => {
  try {
    const validated = loginSchema.parse(data);
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
 * Validate email
 */
const validateEmail = (data) => {
  try {
    const validated = emailSchema.parse(data);
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
  registerSchema,
  loginSchema,
  emailSchema,
  validateRegister,
  validateLogin,
  validateEmail,
};