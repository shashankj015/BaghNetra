const path = require('path');
const fs = require('fs');
const Image = require('../models/Image');
const Tiger = require('../models/Tiger');
const CameraStation = require('../models/CameraStation');
const quarantineService = require('../services/quarantineService');
const aiClient = require('../services/aiServiceClient');

exports.getImages = async (req, res) => {
  try {
    const { runId, tigerId, reviewStatus, blank, tigerDetected, limit = 50, page = 1 } = req.query;
    const filter = { isDeleted: false };
    
    if (runId) filter.runId = runId;
    if (tigerId) filter.tigerId = tigerId;
    if (reviewStatus) filter.reviewStatus = reviewStatus;
    if (blank !== undefined) filter.blank = blank === 'true';
    if (tigerDetected !== undefined) filter.tigerDetected = tigerDetected === 'true';

    const total = await Image.countDocuments(filter);
    const images = await Image.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      images
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getImageById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json(image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const filePath = req.file.path;
    const stationId = req.body.stationId || 'PTR-C-01';
    
    const station = await CameraStation.findOne({ stationId }) || {
      stationId: 'PTR-C-01',
      latitude: 21.6842,
      longitude: 79.3124
    };

    // Run AI Triage
    const aiRes = await aiClient.processImage(filePath);
    
    const imgDoc = new Image({
      fileName: req.file.originalname,
      filePath: filePath,
      fileSize: req.file.size,
      cameraStation: station.stationId,
      latitude: (aiRes.exif && aiRes.exif.latitude) || station.latitude,
      longitude: (aiRes.exif && aiRes.exif.longitude) || station.longitude,
      hasExifGps: Boolean(aiRes.exif && aiRes.exif.has_exif_gps),
      blank: aiRes.blank,
      blankConfidence: aiRes.blank_confidence,
      tigerDetected: aiRes.tiger_detected,
      tigerConfidence: aiRes.tiger_confidence,
      detectedClass: aiRes.detected_class,
      boundingBox: aiRes.bbox,
      tigerId: aiRes.individual,
      identificationConfidence: aiRes.identification_confidence,
      reviewStatus: aiRes.blank ? 'QUARANTINED' : (aiRes.needs_review ? 'PENDING' : 'AUTO_CONFIRMED'),
      candidates: aiRes.candidates || [],
      modelVersion: aiRes.model_version
    });
    await imgDoc.save();

    if (aiRes.blank) {
      await quarantineService.stageBlankImage(imgDoc, filePath);
    }

    res.status(201).json({
      message: 'Image ingested and triaged successfully',
      image: imgDoc,
      aiAnalysis: aiRes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuarantineList = async (req, res) => {
  try {
    const quarantined = await Image.find({ isQuarantined: true, isDeleted: false }).sort({ updatedAt: -1 });
    const stats = await quarantineService.getQuarantineStats();
    res.json({ stats, images: quarantined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.restoreQuarantine = async (req, res) => {
  try {
    const result = await quarantineService.restoreFromQuarantine(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.purgeQuarantine = async (req, res) => {
  try {
    const { imageIds } = req.body;
    if (!imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({ error: 'imageIds array required for permanent purge' });
    }
    const result = await quarantineService.purgeQuarantine(imageIds);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
