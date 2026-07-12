/**
 * Centralized environment configuration
 * All environment variables should be accessed through this file
 */
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const env = {
  // Server
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // API
  API_VERSION: process.env.API_VERSION || 'v1',
  API_PREFIX: process.env.API_PREFIX || '/api',
  
  // Database (MySQL) - will be used later
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '12345',
  DB_NAME: process.env.DB_NAME || 'docminr_db',


  STORAGE_PATH: process.env.STORAGE_PATH || './storage/knowledge-bases',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 52428800,
  MAX_FILES_PER_UPLOAD: process.env.MAX_FILES_PER_UPLOAD || 100,
  MAX_TOTAL_UPLOAD_SIZE: process.env.MAX_TOTAL_UPLOAD_SIZE || 524288000,
  UPLOAD_BATCH_SIZE:process.env.UPLOAD_BATCH_SIZE || 20,
  MAX_ZIP_SIZE:process.env.MAX_ZIP_SIZE || 524288000,
  TEMP_UPLOAD_DIR:process.env.TEMP_UPLOAD_DIR || './temp/uploads',
  
  // MongoDB - for LangGraph checkpoints (later)
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/docminr',
  
  // Redis (later)
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  
  // AI Service (Python FastAPI) - later
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  
  // Qdrant (later)
  QDRANT_HOST: process.env.QDRANT_HOST || 'localhost',
  QDRANT_PORT: process.env.QDRANT_PORT || 6333,
  
  // JWT (for Sprint 2 - Authentication)
  JWT_SECRET: process.env.JWT_SECRET || 'Heloeiei39&3u8U|/.VMSDV,,XI&7%#)@U!DII812948HSD',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Security
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100,
};

// Validate required environment variables
const requiredEnvVars = ['PORT'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Using default values where applicable');
}

// Log environment (but hide sensitive data)
if (env.NODE_ENV === 'development') {
  console.log('📋 Environment Configuration:');
  console.log(`   PORT: ${env.PORT}`);
  console.log(`   NODE_ENV: ${env.NODE_ENV}`);
  console.log(`   API_PREFIX: ${env.API_PREFIX}`);
  console.log(`   API_VERSION: ${env.API_VERSION}`);
  console.log('   (Sensitive values hidden)');
}

module.exports = env;