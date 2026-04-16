const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Ensure usernames are unique
        trim: true // Remove whitespace
    },
    password: {
        type: String,
        required: true,
        minlength: 6 // Minimum password length
    },
    roles: {
        type: [String],
        default: ['user'], // Default role is 'user'
        enum: ['user', 'admin'] // Allowed roles
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure emails are unique
        trim: true, // Remove whitespace
        lowercase: true // Convert email to lowercase
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Create the User model
const User = mongoose.model('User', userSchema);

// Export the User model
module.exports = User;