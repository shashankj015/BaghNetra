const mongoose = require('mongoose');

const CameraStationSchema = new mongoose.Schema({
  stationId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  zone: {
    type: String,
    enum: ['CORE', 'BUFFER', 'VILLAGE_ADJACENT'],
    default: 'CORE'
  },
  installationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'],
    default: 'ACTIVE'
  },
  batteryLevel: {
    type: Number,
    default: 100
  },
  sdCardCapacityGB: {
    type: Number,
    default: 64
  },
  totalCaptures: {
    type: Number,
    default: 0
  },
  tigerCaptures: {
    type: Number,
    default: 0
  },
  lastCaptureTime: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('CameraStation', CameraStationSchema);
