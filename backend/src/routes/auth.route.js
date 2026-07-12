/**
 * Auth Routes
 * All authentication-related endpoints
 */
const express = require('express');
const { register, login, getMe } = require('../controller/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { firstName, lastName, email, password, confirmPassword }
 * @returns { user, token }
 */
router.post('/register', register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password }
 * @returns { user, token }
 */
router.post('/login', login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 * @headers { Authorization: Bearer <token> }
 * @returns { user }
 */
router.get('/me', authenticate, getMe);

module.exports = router;