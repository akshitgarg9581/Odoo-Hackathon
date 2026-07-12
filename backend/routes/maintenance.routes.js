const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { createMaintenance, completeMaintenance, getMaintenanceLogs, updateMaintenance } = require('../controllers/maintenance.controller');

router.use(requireAuth);

router.post('/', createMaintenance);
router.get('/', getMaintenanceLogs);
router.patch('/:id/complete', completeMaintenance);
router.put('/:id', updateMaintenance);

module.exports = router;
