const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/cameraController');

router.get('/', cameraController.getAllStations);
router.get('/:id', cameraController.getStationById);
router.get('/:id/captures', cameraController.getStationCaptures);
router.post('/:id/ingest', cameraController.triggerStationIngest);
router.post('/', cameraController.createStation);
router.put('/:id', cameraController.updateStation);
router.delete('/:id', cameraController.deleteStation);

module.exports = router;
