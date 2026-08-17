const Alert = require('../models/Alert');

exports.getAllAlerts = async (req, res) => {
  try {
    const { severity, type, acknowledged } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';

    const alerts = await Alert.find(filter).sort({ timestamp: -1 });
    res.json({ count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { alertId: req.params.id },
      {
        acknowledged: true,
        acknowledgedBy: req.user ? req.user.name : 'Pench Field Officer',
        acknowledgedAt: new Date()
      },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json({ message: 'Alert acknowledged', alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAlertStats = async (req, res) => {
  try {
    const criticalCount = await Alert.countDocuments({ severity: 'CRITICAL', acknowledged: false });
    const warningCount = await Alert.countDocuments({ severity: 'WARNING', acknowledged: false });
    const infoCount = await Alert.countDocuments({ severity: 'INFO', acknowledged: false });
    const total = await Alert.countDocuments({});

    res.json({
      activeAlerts: criticalCount + warningCount + infoCount,
      critical: criticalCount,
      warning: warningCount,
      info: infoCount,
      totalAlerts: total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
