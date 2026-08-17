const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Alert Queries & Stats
router.get('/', alertController.getAllAlerts);
router.get('/stats', alertController.getAlertStats);
router.post('/evaluate', alertController.evaluateAlerts);

// Alert Status Lifecycle & Actions
router.put('/:id/review', alertController.reviewAlert);
router.put('/:id/resolve', alertController.resolveAlert);
router.put('/:id/status', alertController.updateAlertStatus);
router.put('/:id/acknowledge', alertController.acknowledgeAlert);

module.exports = router;
