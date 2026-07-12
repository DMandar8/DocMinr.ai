/**
 * User Service
 * Handles all user-related database operations
 * Uses your dm_users table schema
 */
const { pool } = require('../config/db');
const UserModel = require('../models/user.model');

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} - User object or null
 */
const getUserById = async (userId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM dm_users WHERE user_id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return UserModel.fromDatabase(rows[0]);
  } catch (error) {
    throw new Error(`Error fetching user by ID: ${error.message}`);
  }
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - User object or null
 */
const getUserByEmail = async (email) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM dm_users WHERE user_email = ?',
      [email.toLowerCase()]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return UserModel.fromDatabase(rows[0]);
  } catch (error) {
    throw new Error(`Error fetching user by email: ${error.message}`);
  }
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {string} userData.email - Email
 * @param {string} userData.password - Hashed password
 * @returns {Promise<Object>} - Created user object
 */
const createUser = async (userData) => {
  try {
    const dbData = UserModel.toDatabase({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.toLowerCase(),
      password: userData.password,
    });
    
    const [result] = await pool.query(
      `INSERT INTO dm_users 
       (user_fname, user_lname, user_email, user_pass) 
       VALUES (?, ?, ?, ?)`,
      [dbData.user_fname, dbData.user_lname, dbData.user_email, dbData.user_pass]
    );
    
    // Get the created user
    const user = await getUserById(result.insertId);
    return user;
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Email already registered');
    }
    throw new Error(`Error creating user: ${error.message}`);
  }
};

/**
 * Update user
 * @param {number} userId - User ID
 * @param {Object} userData - Data to update
 * @returns {Promise<Object>} - Updated user object
 */
const updateUser = async (userId, userData) => {
  try {
    const dbData = UserModel.toDatabase(userData);
    const fields = [];
    const values = [];
    
    // Build dynamic update query
    Object.keys(dbData).forEach((key) => {
      if (dbData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(dbData[key]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(userId);
    
    const [result] = await pool.query(
      `UPDATE dm_users SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      throw new Error('User not found');
    }
    
    const user = await getUserById(userId);
    return user;
  } catch (error) {
    throw new Error(`Error updating user: ${error.message}`);
  }
};

/**
 * Delete user
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if deleted
 */
const deleteUser = async (userId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM dm_users WHERE user_id = ?',
      [userId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error deleting user: ${error.message}`);
  }
};

/**
 * Check if user exists by email
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - True if exists
 */
const userExistsByEmail = async (email) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id FROM dm_users WHERE user_email = ?',
      [email.toLowerCase()]
    );
    return rows.length > 0;
  } catch (error) {
    throw new Error(`Error checking user existence: ${error.message}`);
  }
};

/**
 * Get all users (paginated)
 * @param {number} page - Page number (starts from 1)
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} - Users and pagination info
 */
const getAllUsers = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM dm_users'
    );
    const total = countResult[0].total;
    
    const [rows] = await pool.query(
      'SELECT * FROM dm_users ORDER BY user_id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    const users = rows.map((row) => UserModel.fromDatabase(row));
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
};

module.exports = {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  userExistsByEmail,
  getAllUsers,
};