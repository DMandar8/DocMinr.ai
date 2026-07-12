/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const { verifyToken } = require('../utils/jwt');
const userService = require('../services/user.service');

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error.message === 'Token expired') {
        const err = new Error('Token expired');
        err.statusCode = 401;
        err.code = 'TOKEN_EXPIRED';
        throw err;
      } else if (error.message === 'Invalid token') {
        const err = new Error('Invalid token');
        err.statusCode = 401;
        err.code = 'INVALID_TOKEN';
        throw err;
      }
      throw error;
    }

    // Check if user exists
    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    req.userData = user; // Full user object (without sanitization)

    next();
  } catch (error) {
    // Set status code if not already set
    if (!error.statusCode) {
      error.statusCode = 401;
    }
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Verifies JWT token but doesn't require it
 * Attaches user if token is valid
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = verifyToken(token);
      const user = await userService.getUserById(decoded.userId);
      
      if (user) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
        };
        req.userData = user;
      } else {
        req.user = null;
      }
    } catch (error) {
      // Invalid token, continue without user
      req.user = null;
    }

    next();
  } catch (error) {
    // On error, continue without user
    req.user = null;
    next();
  }
};

/**
 * Middleware to check if user is authenticated
 * Should be used after authenticate
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    return next(error);
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireAuth,
};