// middlewares/logger.js
// Simple request logger middleware
module.exports = function (req, res, next) {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};
