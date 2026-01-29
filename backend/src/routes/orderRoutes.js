const express = require('express');
const router = express.Router();
const { createOrder, verifyOrderPayment, getMyOrders, getOrderById, getPharmacyOrders, updateOrderStatus } = require('../controllers/orderController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validationMiddleware');

// Pharmacy Admin routes (Placed FIRST to avoid collision with :orderId)
router.get('/pharmacy', authenticateToken, authorizeRole(['PHARMACY_ADMIN']), getPharmacyOrders);
router.put('/:orderId/status', authenticateToken, authorizeRole(['PHARMACY_ADMIN', 'SUPER_ADMIN']), updateOrderStatus);

// User routes
router.post('/verify', authenticateToken, authorizeRole(['USER']), verifyOrderPayment);
router.post('/', authenticateToken, authorizeRole(['USER']), validate(schemas.createOrder), createOrder);
router.get('/me', authenticateToken, authorizeRole(['USER']), getMyOrders);
router.get('/:orderId', authenticateToken, authorizeRole(['USER']), getOrderById);

module.exports = router;
