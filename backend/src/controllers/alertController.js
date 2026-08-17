const Alert = require('../models/Alert');
const alertService = require('../services/alertService');
const { ALERT_STATUS } = require('../config/constants');

/**
 * Get all alerts with dynamic evaluation, filtering, and stats.
 */
exports.getAllAlerts = async (req, res) => {
  try {
    // 1. Synchronize real-time alerts against current database state
    await alertService.evaluateAllAlerts();

    const { status, severity, type, tigerId, search, sortBy } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (severity && severity !== 'ALL') {
      filter.severity = severity;
    }

    if (type && type !== 'ALL') {
      filter.type = type;
    }

    if (tigerId) {
      filter.$or = [
        { tigerId: new RegExp(tigerId, 'i') },
        { secondaryTigerId: new RegExp(tigerId, 'i') }
      ];
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tigerId: searchRegex },
        { tigerName: searchRegex },
        { secondaryTigerId: searchRegex },
        { secondaryTigerName: searchRegex },
        { locationName: searchRegex },
        { villageName: searchRegex },
        { stationId: searchRegex }
      ];
    }

    let sortOption = { timestamp: -1 };
    if (sortBy === 'SEVERITY') {
      sortOption = { severity: 1, timestamp: -1 };
    } else if (sortBy === 'DATE_ASC') {
      sortOption = { timestamp: 1 };
    } else if (sortBy === 'TIGER_ID') {
      sortOption = { tigerId: 1 };
    }

    const alerts = await Alert.find(filter).sort(sortOption);
    const stats = await alertService.getAlertStats();

    res.json({
      count: alerts.length,
      alerts,
      stats
    });
  } catch (err) {
    console.error('[AlertController] Error fetching alerts:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mark alert as REVIEWED
 */
exports.reviewAlert = async (req, res) => {
  try {
    const alert = await alertService.updateAlertStatus(
      req.params.id,
      ALERT_STATUS.REVIEWED,
      req.user
    );
    res.json({
      message: 'Alert status updated to REVIEWED',
      alert
    });
  } catch (err) {
    console.error('[AlertController] Error reviewing alert:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
};

/**
 * Mark alert as RESOLVED
 */
exports.resolveAlert = async (req, res) => {
  try {
    const alert = await alertService.updateAlertStatus(
      req.params.id,
      ALERT_STATUS.RESOLVED,
      req.user
    );
    res.json({
      message: 'Alert status updated to RESOLVED',
      alert
    });
  } catch (err) {
    console.error('[AlertController] Error resolving alert:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
};

/**
 * Generic status transition (ACTIVE, REVIEWED, RESOLVED)
 */
exports.updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await alertService.updateAlertStatus(
      req.params.id,
      status,
      req.user
    );
    res.json({
      message: `Alert status updated to ${status}`,
      alert
    });
  } catch (err) {
    console.error('[AlertController] Error updating alert status:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
};

/**
 * Backward compatibility acknowledge endpoint
 */
exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await alertService.updateAlertStatus(
      req.params.id,
      ALERT_STATUS.REVIEWED,
      req.user
    );
    res.json({ message: 'Alert acknowledged', alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get comprehensive alert statistics
 */
exports.getAlertStats = async (req, res) => {
  try {
    const stats = await alertService.getAlertStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Force manual re-evaluation of all alerts
 */
exports.evaluateAlerts = async (req, res) => {
  try {
    await alertService.evaluateAllAlerts();
    const stats = await alertService.getAlertStats();
    const activeAlerts = await Alert.find({ status: ALERT_STATUS.ACTIVE }).sort({ timestamp: -1 });

    res.json({
      message: 'Alert evaluation completed successfully',
      activeCount: activeAlerts.length,
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
