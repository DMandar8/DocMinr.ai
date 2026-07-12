const app = require('./app');
const env = require('./config/env');

const PORT = env.PORT;
const NODE_ENV = env.NODE_ENV;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 DocMinr.ai Backend Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📡 API Version: ${env.API_PREFIX}/${env.API_VERSION}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}${env.API_PREFIX}/${env.API_VERSION}/health`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log('━'.repeat(50));
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🛑 Received shutdown signal. Closing server gracefully...');
  
  server.close(() => {
    console.log('✅ Server closed. Exiting process.');
    process.exit(0);
  });

  // Force close after 10 seconds if not closed
  setTimeout(() => {
    console.error('⚠️  Could not close connections in time. Forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

module.exports = server;