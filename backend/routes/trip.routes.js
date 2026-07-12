const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { createTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip, getTrips, getTripById } = require('../controllers/trip.controller');

router.use(requireAuth);

router.post('/', createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.delete('/:id', deleteTrip);

router.patch('/:id/dispatch', dispatchTrip);
router.patch('/:id/complete', completeTrip);
router.patch('/:id/cancel', cancelTrip);

module.exports = router;
