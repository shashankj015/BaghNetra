const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fingerprint: {
    type: String,
    index: true
  },
  tigerId: {
    type: String,
    required: true,
    index: true
  },
  tigerName: {
    type: String,
    default: 'Pench Individual'
  },
  secondaryTigerId: {
    type: String,
    default: null
  },
  secondaryTigerName: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: [
      'VILLAGE_ADJACENT_RISK',
      'TERRITORY_OVERLAP',
      'PROLONGED_ABSENCE',
      'RANGE_CENTROID_SHIFT',
      'FIRST_STATION_CAPTURE',
      'BUFFER_ENCROACHMENT'
    ],
    required: true,
    index: true
  },
  categoryLabel: {
    type: String,
    default: 'Wildlife Alert'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'REVIEWED', 'RESOLVED'],
    default: 'ACTIVE',
    index: true
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'WARNING', 'INFO'],
    default: 'WARNING',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  locationName: {
    type: String
  },
  villageName: {
    type: String
  },
  distanceKm: {
    type: Number
  },
  overlapAreaKm2: {
    type: Number
  },
  daysAbsent: {
    type: Number
  },
  lastSeenDate: {
    type: Date
  },
  detectionTime: {
    type: Date,
    default: Date.now
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
  targetCoordinates: {
    latitude: Number,
    longitude: Number
  },
  confidence: {
    type: Number,
    default: 0.95
  },
  isSurveyArtifact: {
    type: Boolean,
    default: false
  },
  // Status Tracking & Workflow
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: String
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: String
  },
  // Backward compatibility fields
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
  previousEvidence: {
    type: mongoose.Schema.Types.Mixed
  },
  newEvidence: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
