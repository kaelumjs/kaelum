// core/etag.js
// Kaelum - ETag Middleware
//
// Configures Express's built-in ETag support and optionally installs
// a per-request middleware to suppress ETags on excluded paths.
//
// Uses Express's native ETag implementation (app.set('etag', ...)) which
// already handles:
//   - ETag generation (sha1 of body, truncated)
//   - If-None-Match → 304 Not Modified negotiation
//   - Correct handling of streams and edge cases
//
// Usage (via createApp method):
//   app.useEtag();
//   app.useEtag({ weak: true, exclude: ['/stream', '/events/*'] });
//
// Usage (via setConfig):
//   app.setConfig({ etag: true });
//   app.setConfig({ etag: { weak: true, exclude: ['/stream'] } });

"use strict";

/**
 * Check if a path matches any exclude pattern.
 * Supports exact strings and wildcard suffix patterns (e.g. '/api/*').
 * @param {string} reqPath
 * @param {string[]} excludes
 * @returns {boolean}
 */
function isExcluded(reqPath, excludes) {
  for (const pattern of excludes) {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1); // remove '*'
      if (reqPath.startsWith(prefix)) return true;
    } else {
      if (reqPath === pattern || reqPath.startsWith(pattern + "/")) return true;
    }
  }
  return false;
}

/**
 * Configure ETag support on the Express app.
 *
 * @param {import('express').Express} app
 * @param {Object}   [options]
 * @param {boolean}  [options.weak=false]   Use weak ETags (W/"..."). Default: strong.
 * @param {string[]} [options.exclude=[]]   Paths that should NOT have ETags.
 * @returns {import('express').Express} app
 */
function setupEtag(app, options = {}) {
  const { weak = false, exclude: excludePaths = [] } = options;

  // Configure Express's native ETag mode
  app.set("etag", weak ? "weak" : "strong");

  // If there are excluded paths, install a middleware that strips the ETag
  // header for those specific paths after the response is generated.
  if (Array.isArray(excludePaths) && excludePaths.length > 0) {
    const excludeList = excludePaths;

    app.use(function kaelumEtagExclude(req, res, next) {
      if (isExcluded(req.path, excludeList)) {
        // Override res.setHeader to suppress ETag on excluded paths
        const originalSetHeader = res.setHeader;
        res.setHeader = function (key, value) {
          if (key.toLowerCase() === "etag") return this;
          return originalSetHeader.call(this, key, value);
        };
      }
      next();
    });
  }

  return app;
}

module.exports = { setupEtag };
