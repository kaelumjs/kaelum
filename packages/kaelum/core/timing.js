// core/timing.js
// Kaelum - server timing middleware
//
// Adds a Server-Timing header with the total request processing duration.
// Follows the W3C Server-Timing specification.
//
// Usage:
//   const timing = require('./core/timing');
//   timing(app);
//   timing(app, { precision: 2 });

/**
 * @typedef {Object} TimingOptions
 * @property {string} [headerName] - Header name (default 'Server-Timing')
 * @property {number} [precision] - Decimal places for duration in ms (default 2)
 */

const DEFAULTS = {
  headerName: "Server-Timing",
  precision: 2,
};

/**
 * Register server timing middleware on the app.
 * Measures total request processing time and adds it as a
 * Server-Timing header in the format: total;dur=12.34
 *
 * @param {import('express').Express} app
 * @param {TimingOptions} [options]
 * @returns {import('express').Express} app (for chaining)
 */
function timing(app, options = {}) {
  // Guard: prevent double-registration
  if (app.locals && app.locals._kaelum_timing_installed) {
    return app;
  }

  const headerName = options.headerName || DEFAULTS.headerName;
  const precision = typeof options.precision === "number"
    ? options.precision
    : DEFAULTS.precision;

  const middleware = (req, res, next) => {
    const start = process.hrtime.bigint();

    // Override writeHead to inject the timing header before headers are sent
    const originalWriteHead = res.writeHead;
    res.writeHead = function (...args) {
      const end = process.hrtime.bigint();
      const durationNs = Number(end - start);
      const durationMs = (durationNs / 1_000_000).toFixed(precision);

      // Only add if not already set
      if (!res.getHeader(headerName)) {
        res.setHeader(headerName, `total;dur=${durationMs}`);
      }

      return originalWriteHead.apply(this, args);
    };

    next();
  };

  // Tag the middleware for identification
  middleware._kaelum_name = "timing";

  app.use(middleware);

  // Mark as installed
  if (!app.locals) app.locals = {};
  app.locals._kaelum_timing_installed = true;

  return app;
}

module.exports = timing;
