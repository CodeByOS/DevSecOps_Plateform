// Central error handler — catches all errors thrown in controllers
// Must be the LAST middleware registered in server.js

const errorHandler = (err, req, res, next) => {
    // Log the error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose: duplicate key (e.g. email already exists)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
        statusCode = 400;
    }

    // Mongoose: validation error (required fields, enums, etc.)
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors)
        .map((e) => e.message)
        .join(', ');
        statusCode = 400;
    }

    // Mongoose: invalid ObjectId format
    if (err.name === 'CastError') {
        message = `Invalid ID: ${err.value}`;
        statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token';
        statusCode = 401;
    }
    if (err.name === 'TokenExpiredError') {
        message = 'Token expired';
        statusCode = 401;
    }

    res.status(statusCode).json({
        success: false,
        message,
        // Show stack trace only in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

module.exports = errorHandler;
