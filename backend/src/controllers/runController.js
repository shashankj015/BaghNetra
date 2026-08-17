const ProcessingRun = require('../models/ProcessingRun');
const Image = require('../models/Image');
const batchService = require('../services/batchIngestService');

exports.getAllRuns = async (req, res) => {
  try {
    const runs = await ProcessingRun.find({}).sort({ createdAt: -1 });
    res.json({ count: runs.length, runs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRunById = async (req, res) => {
  try {
    const run = await ProcessingRun.findOne({ runId: req.params.id });
    if (!run) {
      return res.status(404).json({ error: 'Processing run not found' });
    }

    const liveProgress = batchService.getJobProgress(run.runId);
    res.json({ run, liveProgress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRunSpatialSummary = async (req, res) => {
  try {
    const run = await ProcessingRun.findOne({ runId: req.params.id });
    if (!run) {
      return res.status(404).json({ error: 'Processing run not found' });
    }

    const occupancyService = require('../services/occupancyService');
    const spatialSummary = run.spatialSummary || await occupancyService.generateRunSpatialDossier(run.runId);
    res.json({ runId: run.runId, spatialSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.startRun = async (req, res) => {
  try {
    const { folderPath, stationId, options } = req.body;
    if (!folderPath) {
      return res.status(400).json({ error: 'folderPath is required' });
    }

    const result = await batchService.startBatchRun(folderPath, stationId || 'PTR-C-01', options || {});
    res.status(202).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


