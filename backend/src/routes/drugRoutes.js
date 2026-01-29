const express = require('express');
const router = express.Router();
const { createDrug, getDrugs, getSuggestions, addDrugToPharmacy, updateInventory, searchDrugsWithPricing, comparePrices, updateDrug, deleteDrug } = require('../controllers/drugController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validationMiddleware');

// Public
router.get('/', getDrugs);
router.get('/search', searchDrugsWithPricing);
router.get('/compare', comparePrices); // Optimized SQL Search
router.get('/suggestions', getSuggestions);

// Pharmacy Admin
router.post('/inventory', authenticateToken, authorizeRole(['PHARMACY_ADMIN']), validate(schemas.addInventory), addDrugToPharmacy);
router.put('/inventory/:drugId', authenticateToken, authorizeRole(['PHARMACY_ADMIN']), updateInventory);

// Super Admin & Pharmacy Admin (maybe?)
router.post('/', authenticateToken, authorizeRole(['SUPER_ADMIN', 'PHARMACY_ADMIN']), validate(schemas.createDrug), createDrug);
router.put('/:id', authenticateToken, authorizeRole(['SUPER_ADMIN']), updateDrug);
router.delete('/:id', authenticateToken, authorizeRole(['SUPER_ADMIN']), deleteDrug);

module.exports = router;
