const express = require('express');
const router = express.Router();
const { createPharmacy, getMyPharmacy, updateMyPharmacy, searchNearby, getAllPharmacies, verifyPharmacy, getPharmacyStats, deletePharmacy, requestDeletion, discoverNearby, getPharmacyById, getPharmacyReviews } = require('../controllers/pharmacyController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validationMiddleware');

// Public or User routes
router.get('/search', searchNearby);
router.get('/discover', discoverNearby);
router.get('/:id', getPharmacyById);
router.get('/:id/reviews', getPharmacyReviews);

// Pharmacy Admin routes
router.post('/', authenticateToken, authorizeRole(['PHARMACY_ADMIN', 'SUPER_ADMIN']), validate(schemas.createPharmacy), createPharmacy);
router.get('/me', authenticateToken, authorizeRole(['PHARMACY_ADMIN']), getMyPharmacy);
router.put('/me', authenticateToken, authorizeRole(['PHARMACY_ADMIN']), validate(schemas.createPharmacy), updateMyPharmacy);
router.get('/stats', authenticateToken, authorizeRole(['PHARMACY_ADMIN']), getPharmacyStats);
router.post('/delete-request', authenticateToken, authorizeRole(['PHARMACY_ADMIN']), requestDeletion);

// Super Admin routes
router.get('/', authenticateToken, authorizeRole(['SUPER_ADMIN']), getAllPharmacies);
router.put('/:pharmacyId/verify', authenticateToken, authorizeRole(['SUPER_ADMIN']), verifyPharmacy);
router.delete('/:pharmacyId', authenticateToken, authorizeRole(['SUPER_ADMIN']), deletePharmacy); // Admin delete
router.delete('/me', authenticateToken, authorizeRole(['PHARMACY_ADMIN']), deletePharmacy); // Self delete

module.exports = router;
