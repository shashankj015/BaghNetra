const aiClient = require('../services/aiServiceClient');
const ModelVersion = require('../models/ModelVersion');

exports.getModelStatus = async (req, res) => {
  try {
    const aiStatus = await aiClient.getModelStatus();
    res.json(aiStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHealth = async (req, res) => {
  try {
    const aiHealth = await aiClient.checkHealth();
    res.json({
      backend: { status: 'healthy', uptime: process.uptime() },
      aiService: aiHealth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
