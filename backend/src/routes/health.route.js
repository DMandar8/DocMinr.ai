const express = require('express');
const { getHealthStatus } = require('../controller/health.controller');

const router = express.Router();


router.get('/', getHealthStatus);

module.exports = router;