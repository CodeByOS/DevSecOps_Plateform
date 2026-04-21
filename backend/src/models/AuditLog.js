// Immutable audit trail — records every important action in the platform
// IMPORTANT: Never add DELETE routes for audit logs (compliance requirement)

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system-triggered actions
    },

    // What was done
    action: {
      type: String,
      required: true,
      // Examples: LOGIN, LOGOUT, PROJECT_CREATED, PIPELINE_BLOCKED,
      //           GATE_OVERRIDE, MEMBER_INVITED, SETTINGS_CHANGED
    },

    // Which project was affected (optional)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },

    // Extra details about the action (free-form object)
    details: {
      type: Object,
      default: {},
    },

    // Request metadata for security auditing
    ipAddress: { type: String, default: null },
    userAgent:  { type: String, default: null },
  },
  {
    // Only createdAt — no updatedAt since logs are immutable
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Static helper to create a log entry easily from anywhere in the app
AuditLogSchema.statics.log = function (data) {
  return this.create(data);
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);
