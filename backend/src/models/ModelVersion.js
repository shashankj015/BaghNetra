const mongoose = require('mongoose');

const ModelVersionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  architecture: {
    type: String
  },
  task: {
    type: String,
    enum: ['BLANK_DETECTION', 'TIGER_DETECTION', 'STRIPE_RE_ID'],
    required: true
  },
  accuracy: Number,
  precision: Number,
  recall: Number,
  f1Score: Number,
  mAP50: Number,
  top1Accuracy: Number,
  top3Accuracy: Number,
  isActive: {
    type: Boolean,
    default: true
  },
  trainedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ModelVersion', ModelVersionSchema);
