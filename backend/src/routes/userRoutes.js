const express = require('express');
const router = express.Router();
const { getUsers, toggleUserStatus, getMe, updateMe, saveItem, removeSavedItem, getSavedItems, updateLocation } = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

// Profile Management (All Authenticated Users)
router.get('/profile', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateMe);
router.put('/location', authenticateToken, updateLocation);

// Super Admin Only
router.get('/', authenticateToken, authorizeRole(['SUPER_ADMIN']), getUsers);
router.put('/:userId/status', authenticateToken, authorizeRole(['SUPER_ADMIN']), toggleUserStatus);

// Saved Items (Favorites)
router.get('/saved', authenticateToken, getSavedItems);
router.post('/saved', authenticateToken, saveItem);
router.delete('/saved/:drugId', authenticateToken, removeSavedItem);

module.exports = router;
