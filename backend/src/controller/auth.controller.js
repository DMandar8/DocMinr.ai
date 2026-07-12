/**
 * Auth Controller
 * Handles HTTP requests for authentication
 */
const authService = require('../services/auth.service');
const { validateRegister, validateLogin } = require('../validations/auth.validation');

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    // Validate request body
    const validation = validateRegister(req.body);
    if (!validation.valid) {
      const error = new Error('Validation Error');
      error.statusCode = 400;
      error.details = validation.errors;
      throw error;
    }

    // Register user
    const result = await authService.register(validation.data);

    // Send response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    // Pass to error handler
    next(error);
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    // Validate request body
    const validation = validateLogin(req.body);
    if (!validation.valid) {
      const error = new Error('Validation Error');
      error.statusCode = 400;
      error.details = validation.errors;
      throw error;
    }

    // Login user
    const result = await authService.login(validation.data);

    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    // Pass to error handler
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 * Protected route - requires authentication
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    const userId = req.user.userId;
    
    // Get current user
    const user = await authService.getCurrentUser(userId);

    // Send response
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};