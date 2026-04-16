// This middleware function handles 404 errors for the application.
// It sends a response indicating that the requested resource was not found.

const notFound = (req, res, next) => {
    res.status(404).json({ message: "Resource not found" });
};

module.exports = notFound;