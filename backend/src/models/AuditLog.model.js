const mongoose = require('mongoose');

// Define the schema for the AuditLog model
const auditLogSchema = new mongoose.Schema({
    actionType: {
        type: String,
        required: true, // Action type is required
        enum: ['CREATE', 'UPDATE', 'DELETE'], // Allowed action types
    },
    timestamp: {
        type: Date,
        default: Date.now, // Default to the current date and time
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true, // User ID is required
    },
    details: {
        type: String,
        required: true, // Details about the action are required
    },
});

// Create the AuditLog model using the schema
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Export the AuditLog model
module.exports = AuditLog;