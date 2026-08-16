const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true
  },
  tigerId: {
    type: String,
    required: true
  },
  tigerName: {
    type: String,
    default: 'Pench Individual'
  },
  type: {
    type: String,
    enum: [
      'RANGE_CENTROID_SHIFT',
      'FIRST_STATION_CAPTURE',
      'BUFFER_ENCROACHMENT',
      'VILLAGE_ADJACENT_RISK',
      'PROLONGED_ABSENCE'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'WARNING', 'INFO'],
    default: 'WARNING'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  previousEvidence: {
    type: mongoose.Schema.Types.Mixed
  },
  newEvidence: {
    type: mongoose.Schema.Types.Mixed
  },
  confidence: {
    type: Number,
    default: 0.90
  },
  stationId: {
    type: String
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  isSurveyArtifact: {
    type: Boolean,
    default: false // Set to true if station was recently installed (compensates for survey effort)
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedBy: {
    type: String
  },
  acknowledgedAt: {
    type: Date
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
