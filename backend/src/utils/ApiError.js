class ApiError extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent constructor (Error)
        this.statusCode = statusCode; // Set the status code
    }

    static badRequest(message) {
        return new ApiError(message || 'Bad Request', 400); // Create a 400 Bad Request error
    }

    static unauthorized(message) {
        return new ApiError(message || 'Unauthorized', 401); // Create a 401 Unauthorized error
    }

    static forbidden(message) {
        return new ApiError(message || 'Forbidden', 403); // Create a 403 Forbidden error
    }

    static notFound(message) {
        return new ApiError(message || 'Not Found', 404); // Create a 404 Not Found error
    }

    static internal(message) {
        return new ApiError(message || 'Internal Server Error', 500); // Create a 500 Internal Server Error
    }
}

module.exports = ApiError; // Export the ApiError class for use in other files