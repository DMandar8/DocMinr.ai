const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const healthRoute = require('./routes/health.route');
const authRoute = require('./routes/auth.route'); // NEW
const { notFoundHandler } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');
const knowledgeBaseRoute = require('./routes/knowledgeBase.route');
const documentRoute = require('./routes/document.route'); // NEW
const aiRoute = require('./routes/ai.route');  // ← ADD THIS




// Create Express app
const app = express();


/**
 * Middleware Registration
 * Order matters - they execute in this sequence
 */

// 1. Security middleware
app.use(helmet()); // Set security HTTP headers

// 2. CORS middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));


// 4. Logging middleware
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Detailed logging in development
} else {
  app.use(morgan('combined')); // Apache-style logging in production
}

// 5. Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// 6. Request logging (custom)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

/**
 * Route Registration
 * All routes are prefixed with API version
 */
const API_PREFIX = `${env.API_PREFIX}/${env.API_VERSION}`;

// Health check route
app.use(`${API_PREFIX}/health`, healthRoute);

// Auth routes
app.use(`${API_PREFIX}/auth`, authRoute); // NEW

// Knowledge Base routes - NEW
app.use(`${API_PREFIX}/knowledge-bases`, knowledgeBaseRoute);

app.use(`${API_PREFIX}/documents`, documentRoute); // NEW

app.use(`${API_PREFIX}/ai`, aiRoute); 

// Root route - basic info
app.get('/', (req, res) => {
  res.json({
    name: 'DocMinr.ai Backend',
    version: env.API_VERSION,
    status: 'running',
    documentation: `${API_PREFIX}/health`,
  });
});

// 404 handler - Must be after all routes
app.use(notFoundHandler);

// Error handler - Must be last
app.use(errorHandler);

// Export app for server.js
module.exports = app;