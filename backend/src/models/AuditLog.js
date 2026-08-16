const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    default: 'SYSTEM'
  },
  userName: {
    type: String,
    default: 'Automated Service'
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
