const fs = require('fs');
const path = require('path');
const Tiger = require('../models/Tiger');
const MovementRecord = require('../models/MovementRecord');
const Image = require('../models/Image');
const occupancyService = require('../services/occupancyService');
const aiClient = require('../services/aiServiceClient');

// Auto-seed helper
async function ensureDatasetTigers() {
  const jsonPath = path.join(__dirname, '../utils/dataset_tigers.json');
  if (!fs.existsSync(jsonPath)) return;
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const count = await Tiger.countDocuments();
  let needSeed = count !== raw.length;
  if (!needSeed) {
    const sample = await Tiger.findOne({});
    if (!sample || sample.tigerId !== raw[0].tigerId || !sample.embedding || sample.embedding.length !== 512) {
      needSeed = true;
    }
  }
  if (needSeed) {
    try {
      await Tiger.deleteMany({});
      await Tiger.insertMany(raw);
      console.log(`[TigerController] Auto-seeded ${raw.length} tigers with 512-D embeddings from dataset_tigers.json`);
      
      // Sync with AI service
      await aiClient.syncReferenceEmbeddings(raw);
    } catch (err) {
      console.error('[TigerController] Auto-seed error:', err);
    }
  }
}

exports.getAllTigers = async (req, res) => {
  try {
    await ensureDatasetTigers();
    const { status, sex } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (sex) filter.sex = sex;

    const tigers = await Tiger.find(filter).sort({ totalCaptures: -1 });
    res.json({ count: tigers.length, tigers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTigerById = async (req, res) => {
  try {
    const tiger = await Tiger.findOne({ tigerId: req.params.id.toUpperCase() });
    if (!tiger) {
      return res.status(404).json({ error: `Tiger with ID ${req.params.id} not found.` });
    }

    // Fetch movement trail
    const movementRecords = await MovementRecord.find({ tigerId: tiger.tigerId }).sort({ timestamp: 1 });
    
    // Fetch recent image captures
    const recentImages = await Image.find({ tigerId: tiger.tigerId, isQuarantined: false })
      .sort({ timestamp: -1 })
      .limit(12);

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
    const { tigerId, name, sex, estimatedAge, status, embeddings, healthNotes } = req.body;
    
    // Generate next BT-XXX if not provided
    let finalId = tigerId;
    if (!finalId) {
      const count = await Tiger.countDocuments();
      finalId = `BT${(count + 1).toString().padStart(3, '0')}`;
    }

    const existing = await Tiger.findOne({ tigerId: finalId.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: `Tiger ID ${finalId} already exists.` });
    }

    const tiger = new Tiger({
      tigerId: finalId.toUpperCase(),
      name: name || `Pench Tiger ${finalId}`,
      sex: sex || 'UNKNOWN',
      estimatedAge: estimatedAge || 4.0,
      status: status || 'RESIDENT',
      embeddings: embeddings || [],
      healthNotes: healthNotes || 'Newly cataloged individual.'
    });
    await tiger.save();

    // Sync embeddings with AI engine
    const allTigers = await Tiger.find({});
    await aiClient.syncReferenceEmbeddings(allTigers);

    res.status(201).json({ message: 'Tiger enrolled successfully', tiger });
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
      imagePath, 
      imageId, 
      cameraStation, 
      latitude, 
      longitude,
      healthNotes 
    } = req.body;

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

    const newTiger = new Tiger({
      tigerId: finalId,
      name: name || `Wild Tiger #${finalId.replace(/[^0-9]/g, '') || finalId}`,
      sex: sex || 'UNKNOWN',
      estimatedAge: estimatedAge ? Number(estimatedAge) : 3.5,
      status: status || 'RESIDENT',
      representativeImage: imagePath || '',
      referenceImages: imagePath ? [imagePath] : [],
      flankCropImages: imagePath ? [imagePath] : [],
      embeddings: embedding || [],
      totalCaptures: 1,
      healthNotes: healthNotes || 'Newly registered wild tiger individual from camera-trap triage.',
      activityCentroid: {
        latitude: latitude || 21.6840,
        longitude: longitude || 79.3250
      },
      occupiedArea: 25.0
    });
    await newTiger.save();

    // If an imageId was provided, update the Image doc in MongoDB
    if (imageId) {
      await Image.findByIdAndUpdate(imageId, {
        tigerId: finalId,
        reviewStatus: 'AUTO_CONFIRMED',
        needsReview: false
      });
    }

    // Sync all tiger prototype embeddings with AI engine in memory
    const allTigers = await Tiger.find({});
    await aiClient.syncReferenceEmbeddings(allTigers);

    res.status(201).json({
      message: `Tiger ${finalId} successfully enrolled into database!`,
      tiger: newTiger
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
