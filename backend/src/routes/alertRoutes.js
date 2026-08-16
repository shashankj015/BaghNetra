const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/', alertController.getAllAlerts);
router.get('/stats', alertController.getAlertStats);
router.put('/:id/acknowledge', alertController.acknowledgeAlert);

module.exports = router;
