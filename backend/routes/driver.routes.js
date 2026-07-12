const express = require('express');
const router = express.Router();
const { createDriver, getDrivers, getDriverById, updateDriver, deleteDriver } = require('../controllers/driver.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth); // ALL routes protected by authentication!

router.post('/', createDriver);
router.get('/', getDrivers);
router.get('/:id', getDriverById);
router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);

module.exports = router;
