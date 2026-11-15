// core/requestId.js
// Kaelum - request ID middleware
//
// Adds a unique X-Request-Id header to every request and response.
// Uses crypto.randomUUID() (Node 20+, zero dependencies).
//
// Usage:
//   const requestId = require('./core/requestId');
//   requestId(app);
//   requestId(app, { headerName: 'X-Trace-Id', generator: () => 'custom-id' });

const crypto = require("crypto");

const DEFAULTS = {
  headerName: "X-Request-Id",
  generator: () => crypto.randomUUID(),
};

/**
 * @typedef {Object} RequestIdOptions
 * @property {string} [headerName] - Header name (default 'X-Request-Id')
 * @property {Function} [generator] - Custom ID generator function (default crypto.randomUUID)
 */

/**
 * Register request ID middleware on the app.
 * If a request already carries the header (e.g. from an API gateway),
 * the existing value is preserved.
 *
 * The generated/preserved ID is also stored on `req.id` for use
 * in logging, error handling, etc.
 *
 * @param {import('express').Express} app
 * @param {RequestIdOptions} [options]
 * @returns {import('express').Express} app (for chaining)
 */
function requestId(app, options = {}) {
  // Guard: prevent double-registration
  if (app.locals && app.locals._kaelum_requestid_installed) {
    return app;
  }

  const headerName = options.headerName || DEFAULTS.headerName;
  const generator = typeof options.generator === "function"
    ? options.generator
    : DEFAULTS.generator;

  const middleware = (req, res, next) => {
    // Use existing header if present, otherwise generate a new one
    const existing = req.headers[headerName.toLowerCase()];
    const id = existing || generator();

    // Store on req for easy access in handlers and other middleware
    req.id = id;

    // Set on response so clients can correlate
    res.setHeader(headerName, id);

    next();
  };

  // Tag the middleware for identification
  middleware._kaelum_name = "requestId";

  app.use(middleware);

  // Mark as installed
  if (!app.locals) app.locals = {};
  app.locals._kaelum_requestid_installed = true;

  return app;
}

module.exports = requestId;
