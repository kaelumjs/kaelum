// middlewares/authMock.js
// Simple mock "authentication" middleware for demo purposes.
// Checks for header "x-api-key: secret" — if absent, returns 401.

module.exports = function (req, res, next) {
  const key = req.headers["x-api-key"] || req.query.api_key;
  if (!key || key !== "secret") {
    return res
      .status(401)
      .json({ error: { message: "Unauthorized. Provide x-api-key: secret" } });
  }
  next();
};
