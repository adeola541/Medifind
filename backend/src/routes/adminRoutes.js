const express = require('express');
const router = express.Router();
const { getSystemStats } = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

// Check Stats
router.get('/stats', authenticateToken, authorizeRole(['SUPER_ADMIN']), getSystemStats);

module.exports = router;
