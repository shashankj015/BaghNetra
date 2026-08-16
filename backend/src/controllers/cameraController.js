const CameraStation = require('../models/CameraStation');

exports.getAllStations = async (req, res) => {
  try {
    const { zone, status } = req.query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (status) filter.status = status;

    const stations = await CameraStation.find(filter).sort({ stationId: 1 });
    res.json({ count: stations.length, stations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStationById = async (req, res) => {
  try {
    const station = await CameraStation.findOne({ stationId: req.params.id.toUpperCase() });
    if (!station) {
      return res.status(404).json({ error: 'Camera station not found' });
    }
    res.json(station);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStation = async (req, res) => {
  try {
    const { stationId, name, latitude, longitude, zone, installationDate, status } = req.body;
    
    const existing = await CameraStation.findOne({ stationId: stationId.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: `Station ID ${stationId} already exists.` });
    }

    const station = new CameraStation({
      stationId: stationId.toUpperCase(),
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
      zone: zone || 'CORE',
      installationDate: installationDate ? new Date(installationDate) : new Date(),
      status: status || 'ACTIVE'
    });
    await station.save();

    res.status(201).json({ message: 'Camera station added successfully', station });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStation = async (req, res) => {
  try {
    const station = await CameraStation.findOneAndUpdate(
      { stationId: req.params.id.toUpperCase() },
      req.body,
      { new: true }
    );
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    res.json({ message: 'Station updated', station });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStation = async (req, res) => {
  try {
    const station = await CameraStation.findOneAndDelete({ stationId: req.params.id.toUpperCase() });
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    res.json({ message: 'Station deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
