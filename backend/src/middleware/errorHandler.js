module.exports = (err, req, res, next) => {
    // Set the status code based on the error type or default to 500
    const statusCode = err.statusCode || 500;
    
    // Log the error for debugging purposes
    console.error(err);

    // Send the error response to the client
    res.status(statusCode).json({
        status: 'error',
        statusCode: statusCode,
        message: err.message || 'Internal Server Error',
    });
};