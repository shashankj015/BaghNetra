const mongoose = require('mongoose');

const TigerSchema = new mongoose.Schema({
  tigerId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    default: 'Pench Tiger'
  },
  sex: {
    type: String,
    enum: ['MALE', 'FEMALE', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  estimatedAge: {
    type: Number,
    default: 4.5
  },
  status: {
    type: String,
    enum: ['RESIDENT', 'DISPERSING', 'TRANSIENT', 'ABSENT', 'DECEASED'],
    default: 'RESIDENT'
  },
  referenceImages: [{
    type: String
  }],
  flankCropImages: [{
    type: String
  }],
  embeddings: [{
    type: Number
  }],
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  stations: [{
    type: String
  }],
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    stationId: String,
    timestamp: Date,
    confidence: Number,
    imageId: String
  }],
  homeRange: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPoint'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // GeoJSON coordinates format: [[[lon, lat], ...]]
      default: []
    }
  },
  activityCentroid: {
    latitude: {
      type: Number,
      default: 21.6840
    },
    longitude: {
      type: Number,
      default: 79.3250
    }
  },
  occupiedArea: {
    type: Number, // Area in square kilometers
    default: 0.0
  },
  totalCaptures: {
    type: Number,
    default: 0
  },
  healthNotes: {
    type: String,
    default: 'Healthy adult individual. Distinct flank stripe patterns recorded.'
  }
}, { timestamps: true });

module.exports = mongoose.model('Tiger', TigerSchema);
