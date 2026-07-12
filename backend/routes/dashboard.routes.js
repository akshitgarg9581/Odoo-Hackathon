const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { getKPIs, getReports, exportReportsCSV } = require('../controllers/dashboard.controller');

router.use(requireAuth);

router.get('/kpis', getKPIs);
router.get('/reports', getReports);
router.get('/reports/csv', exportReportsCSV);

module.exports = router;
