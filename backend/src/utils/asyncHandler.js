// Wraps async controller functions to automatically catch errors
// Instead of writing try/catch in every controller, just wrap with asyncHandler

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
