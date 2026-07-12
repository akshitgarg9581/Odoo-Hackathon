const express = require('express');
const router = express.Router();
const { createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle } = require('../controllers/vehicle.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.post('/', createVehicle);
router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;
