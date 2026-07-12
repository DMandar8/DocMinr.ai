/**
 * 404 Not Found Middleware
 * Handles routes that don't match any defined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found - ${req.method} ${req.originalUrl}`);
  error.status = 404;
  error.statusCode = 404;
  
  // Pass to error handler
  next(error);
};

module.exports = {
  notFoundHandler,
};