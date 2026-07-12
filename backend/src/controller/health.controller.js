const healthService = require('../services/health.service');

/**
 * Health Check Controller
 * Handles HTTP request/response for health check endpoint
 */
const getHealthStatus = (req, res, next) => {
  try {
    // Get health data from service layer
    const healthData = healthService.getHealthStatus();  // ← Make sure this matches
    
    // Send response
    res.status(200).json({
      success: true,
      ...healthData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthStatus,
};