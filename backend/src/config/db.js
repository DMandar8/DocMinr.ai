/**
 * Database Configuration
 * MySQL connection pool setup
 */
const mysql = require('mysql2/promise');
const env = require('./env');

// Create connection pool
const pool = mysql.createPool({
  host: env.DB_HOST || 'localhost',
  port: env.DB_PORT || 3306,
  user: env.DB_USER || 'root',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'docminr_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
};