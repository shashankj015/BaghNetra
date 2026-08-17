const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const upload = require('../middleware/uploadMiddleware');

router.get('/', imageController.getImages);
router.get('/quarantine', imageController.getQuarantineList);
router.post('/quarantine/purge', imageController.purgeQuarantine);
router.post('/quarantine/:id/restore', imageController.restoreQuarantine);
router.get('/analytics', imageController.getDashboardAnalytics);
router.get('/:id', imageController.getImageById);
router.get('/:id/file', imageController.serveImageFile);

// Support both /upload and /upload-single with either 'file' or 'image' field
const flexibleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

router.post('/upload', flexibleUpload, imageController.uploadSingleImage);
router.post('/upload-single', flexibleUpload, imageController.uploadSingleImage);

module.exports = router;

