const express = require('express');
const { getHospitals } = require('../controllers/hospitalController');

const router = express.Router();

router.get('/', getHospitals);

module.exports = router;
