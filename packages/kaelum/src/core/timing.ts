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

import type { Express, NextFunction, Request, Response } from "express";
import type { TimingOptions } from "../types.js";

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
function timing(app: Express, options: TimingOptions = {}) {
  // Guard: prevent double-registration
  if (app.locals && app.locals._kaelum_timing_installed) {
    return app;
  }

  const middleware = serverTiming(options) as ReturnType<typeof serverTiming> & { _kaelum_name?: string };

  // Tag the middleware for identification
  middleware._kaelum_name = "timing";

  app.use(middleware);

  // Mark as installed
  if (!app.locals) app.locals = {};
  app.locals._kaelum_timing_installed = true;

  return app;
}

/**
 * The Server-Timing middleware on its own: adds `Server-Timing: total;dur=<ms>`
 * to every response, measured from when the request reached this middleware.
 */
function serverTiming(options: TimingOptions = {}) {
  const headerName = options.headerName || DEFAULTS.headerName;
  const precision = typeof options.precision === "number"
    ? options.precision
    : DEFAULTS.precision;

  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();

    // Override writeHead to inject the timing header before headers are sent
    const originalWriteHead = res.writeHead;
    res.writeHead = function (this: Response, ...args: any[]) {
      const end = process.hrtime.bigint();
      const durationNs = Number(end - start);
      const durationMs = (durationNs / 1_000_000).toFixed(precision);

      // Only add if not already set
      if (!res.getHeader(headerName)) {
        res.setHeader(headerName, `total;dur=${durationMs}`);
      }

      return originalWriteHead.apply(this, args as Parameters<typeof originalWriteHead>);
    };

    next();
  };
}

export { serverTiming };

export default timing;
