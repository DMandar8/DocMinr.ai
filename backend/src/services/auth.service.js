/**
 * Auth Service
 * Handles authentication business logic
 */
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/password');
const userService = require('./user.service');
const UserModel = require('../models/user.model');

/**
 * Register a new user
 * @param {Object} userData - Registration data
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {string} userData.email - Email
 * @param {string} userData.password - Plain text password
 * @returns {Promise<Object>} - { user, token }
 */
const register = async (userData) => {
  // Check if user already exists
  const existingUser = await userService.getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash the password
  const hashedPassword = await hashPassword(userData.password);

  // Create the user
  const user = await userService.createUser({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: hashedPassword,
  });

  if (!user) {
    throw new Error('Failed to create user');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.userId,
    email: user.email,
  });

  // Return user (without password) and token
  const { password, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - Email
 * @param {string} credentials.password - Plain text password
 * @returns {Promise<Object>} - { user, token }
 */
const login = async (credentials) => {
  // Get user by email
  const user = await userService.getUserByEmail(credentials.email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(credentials.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.userId,
    email: user.email,
  });

  // Return user (without password) and token
  const { password, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Get current user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - User object without password
 */
const getCurrentUser = async (userId) => {
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Verify user exists and is active
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if user exists
 */
const verifyUserExists = async (userId) => {
  const user = await userService.getUserById(userId);
  return !!user;
};

module.exports = {
  register,
  login,
  getCurrentUser,
  verifyUserExists,
};