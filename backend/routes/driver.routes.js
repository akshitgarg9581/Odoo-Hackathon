const express = require('express');
const router = express.Router();
const { createDriver, getDrivers } = require('../controllers/driver.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.post('/', createDriver);
router.get('/', getDrivers);

module.exports = router;
