const Tiger = require('../models/Tiger');
const MovementRecord = require('../models/MovementRecord');
const Image = require('../models/Image');
const occupancyService = require('../services/occupancyService');
const aiClient = require('../services/aiServiceClient');

exports.getAllTigers = async (req, res) => {
  try {
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
