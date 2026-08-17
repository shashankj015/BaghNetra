const mongoose = require('mongoose');

const DetectionSchema = new mongoose.Schema({
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  },
  class: {
    type: String,
    enum: ['tiger', 'other_animal', 'human', 'none'],
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  bbox: [{
    type: Number
  }],
  hasHuman: {
    type: Boolean,
    default: false
  },
  privacyMasked: {
    type: Boolean,
    default: false
  },
  cropPath: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Detection', DetectionSchema);
