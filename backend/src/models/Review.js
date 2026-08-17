const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  reviewId: {
    type: String,
    required: true,
    unique: true
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewerName: {
    type: String,
    default: 'Field Biologist'
  },
  originalPrediction: {
    tigerId: String,
    confidence: Number,
    candidates: [{
      tigerId: String,
      name: String,
      similarity: Number
    }]
  },
  action: {
    type: String,
    enum: ['CONFIRM', 'ASSIGN_TIGER', 'CREATE_NEW', 'REJECT'],
    required: true
  },
  assignedTigerId: {
    type: String
  },
  assignedTigerName: {
    type: String
  },
  notes: {
    type: String
  },
  reviewTimestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
