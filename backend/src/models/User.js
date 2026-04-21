const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Never return password in queries by default
    },

    // Role determines what the user can do in the platform
    role: {
        type: String,
        enum: ['admin', 'developer', 'viewer'],
        default: 'developer',
    },

    // Used to invalidate all tokens when user logs out or changes password
    tokenVersion: {
        type: Number,
        default: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

//* Hash password before saving 
UserSchema.pre('save', async function (next) {
    // Only hash if password was modified (not on every save)
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

//* Compare entered password with hashed password in DB
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

//* Generate short-lived access token (15 min)
UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role, tokenVersion: this.tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );
};

//* Generate long-lived refresh token (7 days)
UserSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id, tokenVersion: this.tokenVersion },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
};

module.exports = mongoose.model('User', UserSchema);
