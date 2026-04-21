const jwt = require('jsonwebtoken');
const User = require('../models/User');

//* Verify access token
// Attach the user to req.user if the token is valid
const protect = async (req, res, next) => {
    let token;

    // Expect token in the Authorization header: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    try {
        // Decode and verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from DB to check if they still exist and token version matches
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        // If tokenVersion doesn't match, user has logged out everywhere
        if (decoded.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ success: false, message: 'Session expired, please login again' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

//* Role-based access control
// Usage: authorize('admin') or authorize('admin', 'developer')
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not allowed to access this route`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
