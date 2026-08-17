const mongoose = require('mongoose');

const ProcessingRunSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
    unique: true
  },
  folderPath: {
    type: String,
    required: true
  },
  stationId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'QUEUED'
  },
  totalImages: {
    type: Number,
    default: 0
  },
  processedImages: {
    type: Number,
    default: 0
  },
  blankCount: {
    type: Number,
    default: 0
  },
  tigerCount: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  otherAnimalCount: {
    type: Number,
    default: 0
  },
  humanCount: {
    type: Number,
    default: 0
  },
  diskSpaceSavedMB: {
    type: Number,
    default: 0.0
  },
  throughputFps: {
    type: Number,
    default: 0.0
  },
  durationSeconds: {
    type: Number,
    default: 0.0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  errorLog: [{
    fileName: String,
    error: String,
    timestamp: Date
  }],
  spatialSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('ProcessingRun', ProcessingRunSchema);
