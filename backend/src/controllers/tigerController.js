const fs = require('fs');
const path = require('path');
const Tiger = require('../models/Tiger');
const MovementRecord = require('../models/MovementRecord');
const Image = require('../models/Image');
const occupancyService = require('../services/occupancyService');
const aiClient = require('../services/aiServiceClient');

// Helper to flatten and sanitize neural embedding vectors into a clean 1D Number array
function sanitizeEmbedding(emb) {
  if (!emb) return [];
  if (typeof emb === 'string') {
    try {
      emb = JSON.parse(emb);
    } catch (e) {
      return [];
    }
  }
  while (Array.isArray(emb) && emb.length > 0 && Array.isArray(emb[0])) {
    emb = emb.flat();
  }
  if (!Array.isArray(emb)) return [];
  return emb.map(v => Number(v)).filter(v => typeof v === 'number' && !isNaN(v));
}

// Helper to normalize any disk or relative file path to a clean web-accessible URL
function normalizeImagePath(p) {
  if (!p || typeof p !== 'string') return '';
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:') || p.startsWith('blob:')) {
    return p;
  }
  if (p.includes('/uploads/')) {
    return '/uploads/' + p.split('/uploads/').pop();
  }
  if (p.includes('\\uploads\\')) {
    return '/uploads/' + p.split('\\uploads\\').pop();
  }
  if (p.includes('/sample-data/')) {
    return '/sample-data/' + p.split('/sample-data/').pop();
  }
  if (p.includes('/quarantine/')) {
    return '/quarantine/' + p.split('/quarantine/').pop();
  }
  if (p.includes('/re-id/')) {
    return '/re-id/' + p.split('/re-id/').pop();
  }
  if (p.includes('/re id/')) {
    return '/re-id/' + p.split('/re id/').pop();
  }
  if (!p.startsWith('/')) {
    return '/' + p;
  }
  return p;
}

// Auto-seed helper - only seed if database is completely empty
async function ensureDatasetTigers() {
  const jsonPath = path.join(__dirname, '../utils/dataset_tigers.json');
  if (!fs.existsSync(jsonPath)) return;
  const count = await Tiger.countDocuments();
  if (count === 0) {
    try {
      const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      await Tiger.insertMany(raw);
      console.log(`[TigerController] Auto-seeded ${raw.length} initial tigers with 512-D embeddings from dataset_tigers.json`);
      
      // Sync with AI service
      await aiClient.syncReferenceEmbeddings(raw);
    } catch (err) {
      console.error('[TigerController] Auto-seed error:', err);
    }
  } else {
    // Sanitize any existing tigers with absolute disk paths
    const tigersToFix = await Tiger.find({ representativeImage: { $regex: '/uploads/' } });
    for (const tg of tigersToFix) {
      if (tg.representativeImage && tg.representativeImage.includes('/uploads/')) {
        tg.representativeImage = normalizeImagePath(tg.representativeImage);
        tg.referenceImages = (tg.referenceImages || []).map(normalizeImagePath);
        tg.flankCropImages = (tg.flankCropImages || []).map(normalizeImagePath);
        await tg.save();
      }
    }
  }

  // Ensure all tigers in DB have realistic spatial telemetry & home range areas
  await occupancyService.seedDefaultTelemetryIfEmpty();
}


exports.getAllTigers = async (req, res) => {
  try {
    await ensureDatasetTigers();
    const { status, sex } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (sex) filter.sex = sex;

    let tigers = await Tiger.find(filter).sort({ createdAt: -1 }).lean();
    
    // Ensure all representativeImage paths are clean web paths
    tigers = tigers.map(t => ({
      ...t,
      representativeImage: normalizeImagePath(t.representativeImage || (t.referenceImages && t.referenceImages[0])),
      referenceImages: (t.referenceImages || []).map(normalizeImagePath),
      flankCropImages: (t.flankCropImages || []).map(normalizeImagePath)
    }));

    res.json({ count: tigers.length, tigers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTigerById = async (req, res) => {
  try {
    let tiger = await Tiger.findOne({ tigerId: req.params.id.toUpperCase() }).lean();
    if (!tiger) {
      return res.status(404).json({ error: `Tiger with ID ${req.params.id} not found.` });
    }

    tiger.representativeImage = normalizeImagePath(tiger.representativeImage || (tiger.referenceImages && tiger.referenceImages[0]));
    tiger.referenceImages = (tiger.referenceImages || []).map(normalizeImagePath);
    tiger.flankCropImages = (tiger.flankCropImages || []).map(normalizeImagePath);

    // Fetch movement trail
    const movementRecords = await MovementRecord.find({ tigerId: tiger.tigerId }).sort({ timestamp: 1 });
    
    // Fetch recent image captures
    let recentImages = await Image.find({ tigerId: tiger.tigerId, isQuarantined: false })
      .sort({ timestamp: -1 })
      .limit(12)
      .lean();

    recentImages = recentImages.map(img => ({
      ...img,
      filePath: normalizeImagePath(img.filePath)
    }));

    res.json({
      tiger,
      movementRecords,
      recentImages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.createTiger = async (req, res) => {
  try {
    const { 
      tigerId, 
      name, 
      sex, 
      estimatedAge, 
      status, 
      embeddings, 
      embedding,
      representativeImage,
      cameraStation,
      latitude,
      longitude,
      healthNotes 
    } = req.body;
    
    const CameraStation = require('../models/CameraStation');

    // Generate next TIGER_XXX or BTXXX if not provided
    let finalId = tigerId;
    if (!finalId) {
      const count = await Tiger.countDocuments();
      finalId = `TIGER_${(count + 1).toString().padStart(3, '0')}`;
    } else {
      finalId = finalId.trim().toUpperCase();
    }

    const existing = await Tiger.findOne({ tigerId: finalId });
    if (existing) {
      return res.status(400).json({ error: `Tiger ID ${finalId} already exists in database.` });
    }

    const stId = cameraStation || 'PTR-C-01';
    let station = await CameraStation.findOne({ stationId: stId.toUpperCase() });
    if (!station) {
      station = await CameraStation.findOne({});
    }

    const finalLat = latitude || station?.latitude || 21.6840;
    const finalLon = longitude || station?.longitude || 79.3250;
    const cleanEmb = sanitizeEmbedding(embedding || embeddings);
    const normImagePath = normalizeImagePath(representativeImage);

    const tiger = new Tiger({
      tigerId: finalId,
      name: name || `Pench Tiger ${finalId}`,
      sex: sex || 'UNKNOWN',
      estimatedAge: estimatedAge ? Number(estimatedAge) : 4.0,
      status: status || 'RESIDENT',
      representativeImage: normImagePath,
      referenceImages: normImagePath ? [normImagePath] : [],
      flankCropImages: normImagePath ? [normImagePath] : [],
      embedding: cleanEmb,
      embeddings: cleanEmb,
      healthNotes: healthNotes || 'Newly cataloged individual.',
      stations: [stId],
      activityCentroid: {
        latitude: finalLat,
        longitude: finalLon
      },
      totalCaptures: 1,
      firstSeen: new Date(),
      lastSeen: new Date()
    });
    await tiger.save();


    // Create initial MovementRecords for realistic territory estimation
    const waypoints = occupancyService.generateTerritoryWaypoints(finalLat, finalLon, stId, sex);
    for (const wp of waypoints) {
      const moveRec = new MovementRecord({
        tigerId: finalId,
        stationId: wp.stationId,
        zone: station?.zone || 'CORE',
        latitude: wp.latitude,
        longitude: wp.longitude,
        timestamp: new Date(),
        confidence: wp.confidence || 1.0,
        runId: 'ENROLLMENT'
      });
      await moveRec.save();
    }

    // Regenerate occupancy to generate accurate MCP polygon & area
    const updatedTiger = await occupancyService.regenerateTigerOccupancy(finalId);

    // Sync embeddings with AI engine
    const allTigers = await Tiger.find({});
    await aiClient.syncReferenceEmbeddings(allTigers);

    res.status(201).json({ message: 'Tiger enrolled successfully', tiger: updatedTiger || tiger });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTiger = async (req, res) => {
  try {
    const tiger = await Tiger.findOneAndUpdate(
      { tigerId: req.params.id.toUpperCase() },
      req.body,
      { new: true }
    );
    if (!tiger) {
      return res.status(404).json({ error: 'Tiger not found' });
    }

    // Refresh embeddings in AI service
    const allTigers = await Tiger.find({});
    await aiClient.syncReferenceEmbeddings(allTigers);

    res.json({ message: 'Tiger updated', tiger });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTerritorialOverlaps = async (req, res) => {
  try {
    const overlaps = await occupancyService.calculateTerritorialOverlaps();
    res.json({ count: overlaps.length, overlaps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reseedSparseTelemetry = async (req, res) => {
  try {
    await occupancyService.seedDefaultTelemetryIfEmpty(true);
    const tigers = await Tiger.find({});
    const overlaps = await occupancyService.calculateTerritorialOverlaps();
    res.json({ 
      message: 'Sparse telemetry successfully re-seeded with single prominent overlap', 
      tigerCount: tigers.length, 
      overlapCount: overlaps.length, 
      overlaps 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.regenerateOccupancy = async (req, res) => {
  try {
    const tiger = await occupancyService.regenerateTigerOccupancy(req.params.id.toUpperCase());
    res.json({ message: 'Occupancy recalculated', tiger });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.enrollTigerFromImage = async (req, res) => {
  try {
    const { 
      tigerId, 
      name, 
      sex, 
      estimatedAge, 
      status, 
      embedding, 
      embeddings,
      imagePath, 
      imageId, 
      cameraStation, 
      latitude, 
      longitude,
      healthNotes 
    } = req.body;

    const CameraStation = require('../models/CameraStation');

    let finalId = tigerId;
    if (!finalId) {
      const count = await Tiger.countDocuments();
      finalId = `TIGER_${(count + 1).toString().padStart(3, '0')}`;
    } else {
      finalId = finalId.trim().toUpperCase();
    }

    const existing = await Tiger.findOne({ tigerId: finalId });
    if (existing) {
      return res.status(400).json({ error: `Tiger ID ${finalId} already exists in database.` });
    }

    // Resolve station and GPS coordinates
    const stId = cameraStation || 'PTR-C-01';
    let station = await CameraStation.findOne({ stationId: stId.toUpperCase() });
    if (!station) {
      station = await CameraStation.findOne({}) || {
        stationId: 'PTR-C-01',
        name: 'Karmajhiri Core',
        latitude: 21.6842,
        longitude: 79.3124,
        zone: 'CORE'
      };
    }

    const finalLat = latitude || station.latitude || 21.6840;
    const finalLon = longitude || station.longitude || 79.3250;

    const cleanEmb = sanitizeEmbedding(embedding || embeddings);

    let finalImagePath = normalizeImagePath(imagePath);
    if (!finalImagePath && imageId) {
      const foundImg = await Image.findById(imageId);
      if (foundImg && foundImg.filePath) {
        finalImagePath = normalizeImagePath(foundImg.filePath);
      }
    }

    const newTiger = new Tiger({
      tigerId: finalId,
      name: name || `Wild Tiger #${finalId.replace(/[^0-9]/g, '') || finalId}`,
      sex: sex || 'UNKNOWN',
      estimatedAge: estimatedAge ? Number(estimatedAge) : 3.5,
      status: status || 'RESIDENT',
      representativeImage: finalImagePath,
      referenceImages: finalImagePath ? [finalImagePath] : [],
      flankCropImages: finalImagePath ? [finalImagePath] : [],
      embedding: cleanEmb,
      embeddings: cleanEmb,
      totalCaptures: 1,
      healthNotes: healthNotes || 'Newly registered wild tiger individual from camera-trap triage.',
      stations: [station.stationId],
      activityCentroid: {
        latitude: finalLat,
        longitude: finalLon
      },
      firstSeen: new Date(),
      lastSeen: new Date()
    });
    await newTiger.save();

    // If an imageId was provided, update the Image doc in MongoDB
    if (imageId) {
      await Image.findByIdAndUpdate(imageId, {
        tigerId: finalId,
        reviewStatus: 'AUTO_CONFIRMED',
        needsReview: false,
        cameraStation: station.stationId,
        latitude: finalLat,
        longitude: finalLon
      });
    }

    // Create MovementRecords so the tiger is properly localized and mapped with realistic territory
    const waypoints = occupancyService.generateTerritoryWaypoints(finalLat, finalLon, station.stationId, sex);
    for (const wp of waypoints) {
      const moveRec = new MovementRecord({
        tigerId: finalId,
        imageId: imageId || null,
        stationId: wp.stationId,
        zone: station.zone || 'CORE',
        latitude: wp.latitude,
        longitude: wp.longitude,
        timestamp: new Date(),
        confidence: wp.confidence || 1.0,
        runId: 'ENROLLMENT'
      });
      await moveRec.save();
    }

    // Compute Home Range MCP & Centroid using occupancy service
    const fullyCalculatedTiger = await occupancyService.regenerateTigerOccupancy(finalId);


    // Sync all tiger prototype embeddings with AI engine in memory
    const allTigers = await Tiger.find({});
    await aiClient.syncReferenceEmbeddings(allTigers);

    res.status(201).json({
      message: `Tiger ${finalId} successfully enrolled into database!`,
      tiger: fullyCalculatedTiger || newTiger
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

