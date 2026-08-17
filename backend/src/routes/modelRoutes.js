const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');

router.get('/status', modelController.getModelStatus);
router.get('/health', modelController.getHealth);

module.exports = router;
