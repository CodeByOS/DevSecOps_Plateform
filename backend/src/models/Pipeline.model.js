const mongoose = require('mongoose');

// Define the schema for the Pipeline model
const pipelineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Name is required
        trim: true // Remove whitespace from both ends
    },
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project' // Reference to the Project model
    }]
}, {
    timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Create the Pipeline model using the schema
const Pipeline = mongoose.model('Pipeline', pipelineSchema);

// Export the Pipeline model for use in other parts of the application
module.exports = Pipeline;