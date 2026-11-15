// core/trailingSlash.js
// Middleware that redirects requests with trailing slashes to the canonical path.
// Example: /users/ → /users (preserving query string)

/**
 * Sets up trailing slash redirect middleware on the app.
 *
 * @param {import('express').Application} app
 * @param {Object} [options]
 * @param {number} [options.status=301] - HTTP redirect status code
 */
function setupTrimTrailingSlash(app, options = {}) {
  const status = options.status || 301;

  app.use(function kaelumTrimTrailingSlash(req, res, next) {
    // Only redirect if path has a trailing slash AND it's not the root "/"
    if (req.path.length > 1 && req.path.endsWith("/")) {
      const cleanPath = req.path.slice(0, -1);
      // Preserve query string
      const search = req._parsedUrl ? req._parsedUrl.search || "" : "";
      return res.redirect(status, cleanPath + search);
    }
    next();
  });
}

module.exports = { setupTrimTrailingSlash };
