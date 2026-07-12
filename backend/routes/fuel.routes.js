const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { createFuelLog, getFuelLogs } = require('../controllers/fuel.controller');

router.use(requireAuth);

router.post('/', createFuelLog);
router.get('/', getFuelLogs);

module.exports = router;
