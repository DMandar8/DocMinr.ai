const env = require('../config/env');

/**
 * Global Error Handler Middleware
 * Handles all errors thrown in the application
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    status: err.status || err.statusCode || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Default values
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = err.details || err.errors;
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized - Invalid or expired token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Unauthorized - Token expired';
  } else if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') { // MySQL or PostgreSQL duplicate
    statusCode = 409;
    message = 'Duplicate entry - Resource already exists';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable - Database connection refused';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    status: statusCode,
    message: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
    method: req.method,
  };

  // Add error details in development mode
  if (env.NODE_ENV === 'development') {
    errorResponse.error = {
      name: err.name,
      message: err.message,
      stack: err.stack,
      details: errorDetails,
    };
  } else {
    // Production: only show generic error
    if (statusCode === 500) {
      errorResponse.message = 'Internal Server Error';
    }
    // Log internal errors but don't expose details
    if (statusCode === 500) {
      console.error('🔒 Internal error (details hidden from client):', err);
    }
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

module.exports = {
  errorHandler,
};