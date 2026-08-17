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
    
    const detectedIndividuals = (aiRes.detected_individuals && aiRes.detected_individuals.length > 0)
      ? aiRes.detected_individuals
      : (aiRes.tiger_detected ? [{
          instanceId: 1,
          boundingBox: aiRes.bbox,
          individual: aiRes.individual,
          tigerId: aiRes.individual,
          tigerName: aiRes.tiger_name,
          detectionConfidence: aiRes.tiger_confidence,
          identificationConfidence: aiRes.identification_confidence,
          status: aiRes.status,
          needsReview: aiRes.needs_review,
          candidates: aiRes.candidates || [],
          embedding: aiRes.embedding || []
        }] : []);

    const imgDoc = new Image({
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      cameraStation: station.stationId,
      latitude: (aiRes.exif && aiRes.exif.latitude) || station.latitude,
      longitude: (aiRes.exif && aiRes.exif.longitude) || station.longitude,
      hasExifGps: Boolean(aiRes.exif && aiRes.exif.has_exif_gps),
      blank: aiRes.blank,
      blankConfidence: aiRes.blank_confidence,
      tigerDetected: aiRes.tiger_detected,
      tigerCount: detectedIndividuals.length,
      tigerConfidence: aiRes.tiger_confidence,
      detectedClass: aiRes.detected_class,
      boundingBox: aiRes.bbox,
      detectedIndividuals: detectedIndividuals,
      tigerId: aiRes.individual,
      suggestedTigerId: aiRes.individual,
      identificationConfidence: aiRes.identification_confidence,
      reviewStatus: aiRes.blank 
        ? 'QUARANTINED' 
        : (detectedIndividuals.length > 1 ? 'MULTI_TIGER' : (aiRes.needs_review ? 'PENDING' : 'AUTO_CONFIRMED')),
      candidates: aiRes.candidates || [],
      modelVersion: aiRes.model_version
    });
    await imgDoc.save();

    if (aiRes.blank) {
      await quarantineService.stageBlankImage(imgDoc, filePath);
    }

    // Record movement telemetry and update spatial territory for each confirmed tiger instance
    if (aiRes.tiger_detected && detectedIndividuals.length > 0) {
      const MovementRecord = require('../models/MovementRecord');
      const occupancyService = require('../services/occupancyService');

      for (const ind of detectedIndividuals) {
        if (ind.individual && !ind.needsReview) {
          const moveRec = new MovementRecord({
            tigerId: ind.individual,
            imageId: imgDoc._id,
            stationId: station.stationId,
            zone: station.zone || 'CORE',
            latitude: imgDoc.latitude,
            longitude: imgDoc.longitude,
            timestamp: imgDoc.timestamp,
            confidence: ind.identificationConfidence || 0.95,
            runId: 'SINGLE_UPLOAD'
          });
          await moveRec.save();
          await occupancyService.regenerateTigerOccupancy(ind.individual);
        }
      }
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

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const totalImages = await Image.countDocuments({ isDeleted: false });
    const blankCount = await Image.countDocuments({ blank: true, isDeleted: false });
    const tigerCount = await Image.countDocuments({ tigerDetected: true, isDeleted: false });
    const otherCount = await Image.countDocuments({ detectedClass: 'other_animal', isDeleted: false });
    const humanCount = await Image.countDocuments({ detectedClass: 'human', isDeleted: false });

    // Last 7 days volume aggregation
    const days = [];
    const rawVolume = [];
    const retainedVolume = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push(dayLabel);

      const dayTotal = await Image.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        isDeleted: false
      });
      const dayRetained = await Image.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        blank: false,
        isDeleted: false
      });

      rawVolume.push(dayTotal);
      retainedVolume.push(dayRetained);
    }

    res.json({
      totalImages,
      breakdown: {
        blanks: blankCount,
        tigers: tigerCount,
        otherAnimals: otherCount,
        humans: humanCount
      },
      dailyActivity: {
        labels: days,
        rawVolume,
        retainedVolume
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.serveImageFile = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const candidatePaths = [
      image.filePath,
      image.originalPath,
      image.quarantinePath,
      path.resolve(image.filePath),
      path.resolve(__dirname, '../../../', image.filePath),
      path.resolve(__dirname, '../../', image.filePath),
      path.resolve(process.cwd(), image.filePath),
      path.resolve(process.cwd(), '..', image.filePath)
    ].filter(Boolean);

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return res.sendFile(path.resolve(p));
      }
    }

    res.status(404).json({ error: 'Image binary file missing on disk' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


