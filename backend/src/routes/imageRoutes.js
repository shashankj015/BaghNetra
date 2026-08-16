const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const upload = require('../middleware/uploadMiddleware');

router.get('/', imageController.getImages);
router.get('/quarantine', imageController.getQuarantineList);
router.post('/quarantine/purge', imageController.purgeQuarantine);
router.post('/quarantine/:id/restore', imageController.restoreQuarantine);
router.get('/:id', imageController.getImageById);
router.post('/upload', upload.single('file'), imageController.uploadSingleImage);

module.exports = router;
