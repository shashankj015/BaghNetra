const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// Global Reserve Exports
router.get('/spatial/geojson', exportController.exportReserveGeoJSON);
router.get('/spatial/csv', exportController.exportNTCA_CSV);

// Run-Specific Exports
router.get('/runs/:runId/geojson', exportController.exportRunGeoJSON);
router.get('/runs/:runId/csv', exportController.exportRunCSV);

module.exports = router;
