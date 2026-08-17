const express = require('express');
const router = express.Router();
const runController = require('../controllers/runController');

router.get('/', runController.getAllRuns);
router.get('/:id', runController.getRunById);
router.get('/:id/spatial-summary', runController.getRunSpatialSummary);
router.post('/start', runController.startRun);

module.exports = router;

