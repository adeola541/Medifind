const express = require('express');
const router = express.Router();
const { geocodeAddress, reverseGeocode } = require('../controllers/locationController');

// Public route - Geocoding
router.get('/geocode', geocodeAddress);
router.get('/reverse-geocode', reverseGeocode);
router.get('/reverse', reverseGeocode); // Alias

module.exports = router;
