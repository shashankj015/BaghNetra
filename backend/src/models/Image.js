const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  originalPath: {
    type: String
  },
  quarantinePath: {
    type: String
  },
  tigerCropPath: {
    type: String
  },
  fileSize: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  cameraStation: {
    type: String,
    required: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  hasExifGps: {
    type: Boolean,
    default: false
  },
  blank: {
    type: Boolean,
    default: false
  },
  blankConfidence: {
    type: Number,
    default: 0.0
  },
  tigerDetected: {
    type: Boolean,
    default: false
  },
  tigerCount: {
    type: Number,
    default: 0
  },
  tigerConfidence: {
    type: Number,
    default: 0.0
  },
  detectedClass: {
    type: String,
    default: 'none'
  },
  boundingBox: [{
    type: Number
  }],
  detectedIndividuals: [{
    instanceId: Number,
    boundingBox: [Number],
    stripeBoundingBox: [Number],
    bodyBoundingBox: [Number],
    normalizedBoundingBox: [Number],
    individual: String,
    tigerId: String,
    tigerName: String,
    detectionConfidence: Number,
    identificationConfidence: Number,
    status: String,
    reviewStatus: {
      type: String,
      default: 'PENDING'
    },
    needsReview: Boolean,
    candidates: [{
      tigerId: String,
      name: String,
      similarity: Number,
      representativeImage: String
    }],
    embedding: [Number]
  }],
  tigerId: {
    type: String,
    default: null
  },
  suggestedTigerId: {
    type: String,
    default: null
  },
  identificationConfidence: {
    type: Number,
    default: 0.0
  },
  reviewStatus: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'REASSIGNED', 'NEW_ENROLLED', 'REJECTED', 'AUTO_CONFIRMED', 'QUARANTINED', 'MULTI_TIGER'],
    default: 'PENDING'
  },
  candidates: [{
    tigerId: String,
    name: String,
    similarity: Number,
    representativeImage: String,
    totalCaptures: Number
  }],
  modelVersion: {
    type: String,
    default: 'BaghNetra-Pipeline-v2.0'
  },
  runId: {
    type: String,
    default: null
  },
  isQuarantined: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  processingTimeMs: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Image', ImageSchema);
