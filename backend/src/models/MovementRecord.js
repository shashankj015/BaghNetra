const mongoose = require('mongoose');

const MovementRecordSchema = new mongoose.Schema({
  tigerId: {
    type: String,
    required: true,
    index: true
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  },
  stationId: {
    type: String,
    required: true
  },
  zone: {
    type: String,
    enum: ['CORE', 'BUFFER', 'VILLAGE_ADJACENT'],
    default: 'CORE'
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  confidence: {
    type: Number,
    default: 0.90
  },
  runId: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('MovementRecord', MovementRecordSchema);
