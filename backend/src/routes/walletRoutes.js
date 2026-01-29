const express = require('express');
const router = express.Router();
const { getWallet, initializeTopUp, verifyTopUp, handlePaystackWebhook, simulateTopUp } = require('../controllers/walletController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Get wallet balance and details
router.get('/', authenticateToken, getWallet);

// Initialize a top-up transaction
router.post('/initialize', authenticateToken, initializeTopUp);

// Verify a top-up transaction (Manual/Fallback)
router.post('/verify', authenticateToken, verifyTopUp);

// Simulate Top-Up (Direct Credit)
router.post('/simulate-topup', authenticateToken, simulateTopUp);

// Internal/Paystack Webhook
router.post('/webhook', handlePaystackWebhook);

module.exports = router;
