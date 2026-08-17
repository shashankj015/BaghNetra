const express = require('express');
const router = express.Router();
const tigerController = require('../controllers/tigerController');

router.get('/', tigerController.getAllTigers);
router.get('/overlaps', tigerController.getTerritorialOverlaps);
router.post('/reseed-telemetry', tigerController.reseedSparseTelemetry);
router.get('/:id', tigerController.getTigerById);
router.post('/', tigerController.createTiger);
router.post('/enroll-from-image', tigerController.enrollTigerFromImage);
router.put('/:id', tigerController.updateTiger);
router.post('/:id/regenerate-occupancy', tigerController.regenerateOccupancy);

module.exports = router;

