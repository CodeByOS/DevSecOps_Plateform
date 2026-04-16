const mongoose = require('mongoose');

// Define the Project schema
const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Project name is required
        trim: true // Remove whitespace from both ends
    },
    description: {
        type: String,
        required: true, // Project description is required
        trim: true // Remove whitespace from both ends
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    }],
}, {
    timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Create the Project model
const Project = mongoose.model('Project', projectSchema);

// Export the Project model
module.exports = Project;