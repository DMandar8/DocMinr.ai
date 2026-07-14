/**
 * AI Service Integration
 * Handles communication with the AI microservice
 */
const env = require('../config/env');

const AI_SERVICE_URL = env.AI_SERVICE_URL || 'http://ai-service:8001';
const AI_SERVICE_TIMEOUT = 120000; // 2 minutes

/**
 * Process a document with the AI service
 * @param {number} docId - Document ID
 * @param {number} kbId - Knowledge Base ID
 * @returns {Promise<Object>} - Processing result
 */
const processDocument = async (docId, kbId) => {
  try {
    const url = `${AI_SERVICE_URL}/api/v1/process`;
    const payload = { doc_id: docId, kb_id: kbId };
    
    console.log(`📤 Calling AI service: ${url}`);
    console.log(`   Payload:`, payload);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // Note: Node.js fetch doesn't support timeout directly
      // We'll handle timeout via AbortController
      signal: AbortSignal.timeout(AI_SERVICE_TIMEOUT),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ AI service response:`, data);
    return data;
    
  } catch (error) {
    if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
      throw new Error('AI service request timed out after 2 minutes');
    }
    if (error.code === 'ECONNREFUSED') {
      throw new Error('AI service is not available (connection refused)');
    }
    throw new Error(`AI service error: ${error.message}`);
  }
};

/**
 * Check if AI service is healthy
 * @returns {Promise<boolean>} - True if healthy
 */
const checkHealth = async () => {
  try {
    const url = `${AI_SERVICE_URL}/api/v1/health`;
    console.log(`🔍 Checking AI service health: ${url}`);
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.status === 'healthy' || data.success === true;
    
  } catch (error) {
    console.error('AI service health check failed:', error.message);
    return false;
  }
};

/**
 * Get processing status from AI service
 * @param {number} docId - Document ID
 * @returns {Promise<Object>} - Status info
 */
const getProcessingStatus = async (docId) => {
  try {
    const url = `${AI_SERVICE_URL}/api/v1/process/${docId}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      return { status: 'unknown' };
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Failed to get processing status:', error.message);
    return { status: 'error', message: error.message };
  }
};

module.exports = {
  processDocument,
  checkHealth,
  getProcessingStatus,
};