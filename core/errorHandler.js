// core/errorHandler.js
// Generic error handling middleware factory for Kaelum.
//
// Exports:
//   - module.exports = errorHandlerFactory
//   - module.exports.errorHandler = errorHandlerFactory
//
// Usage:
//   const errorHandler = require('./core/errorHandler');
//   app.use(errorHandler({ exposeStack: false }));
//
// Options:
//   - exposeStack: boolean (default false) -> include stack trace in JSON when true
//   - logger: function(err, req, info?) optional -> custom logger
//   - onError: function(err, req, res) optional -> hook called before sending response
//
// Response JSON shape:
//   { error: { message, code, ...(stack) } }
// Status chosen from err.status || err.statusCode || 500

/**
 * @param {Object} options
 * @param {boolean} [options.exposeStack=false] - include stack trace in responses
 * @param {Function} [options.logger] - optional logger function: logger(err, req, info)
 * @param {Function} [options.onError] - hook called before sending response: onError(err, req, res)
 * @returns {Function} express error-handling middleware (err, req, res, next)
 */
function errorHandlerFactory(options = {}) {
  const { exposeStack = false, logger = null, onError = null } = options || {};

  /**
   * Default logger used when no custom logger is provided.
   * @param {Error|any} err
   * @param {Object} req
   */
  function defaultLog(err, req) {
    const status =
      err && (err.status || err.statusCode)
        ? err.status || err.statusCode
        : 500;
    if (status >= 500) {
      if (err && err.stack) console.error(err.stack);
      else console.error(err);
    } else {
      if (err && err.message) console.warn(err.message);
      else console.warn(err);
    }
  }

  return function errorHandler(err, req, res, next) {
    // If headers already sent, fall back to default express handler
    if (res.headersSent) {
      return next(err);
    }

    // normalize non-error values (e.g., throw "string")
    const normalizedErr =
      err instanceof Error
        ? err
        : new Error(typeof err === "string" ? err : "Unknown error");

    // determine HTTP status
    const status =
      err && (err.status || err.statusCode)
        ? err.status || err.statusCode
        : 500;

    // prepare payload
    const payload = {
      error: {
        message:
          (err && (err.message || err.msg)) ||
          normalizedErr.message ||
          "Internal Server Error",
        code: err && err.code ? err.code : "INTERNAL_ERROR",
      },
    };

    if (exposeStack && normalizedErr && normalizedErr.stack) {
      payload.error.stack = normalizedErr.stack;
    }

    // logging: prefer custom logger if provided
    try {
      if (typeof logger === "function") {
        // allow custom logger to receive (err, req, { status })
        logger(normalizedErr, req, { status });
      } else if (logger !== false) {
        defaultLog(normalizedErr, req);
      }
    } catch (logErr) {
      // don't crash if logger fails
      console.error("Kaelum errorHandler: logger threw an error", logErr);
    }

    // onError hook (e.g., report to external service)
    try {
      if (typeof onError === "function") {
        try {
          onError(normalizedErr, req, res);
        } catch (hookErr) {
          // don't block response if hook fails
          console.error("Kaelum errorHandler: onError hook threw", hookErr);
        }
      }
    } catch (_) {
      // ignore
    }

    // Respond according to Accept header: JSON preferred, fallback to text/html
    if (req && req.accepts && req.accepts("html") && !req.accepts("json")) {
      // simple HTML response for browsers preferring HTML
      const title = `Error ${status}`;
      // sanitize to prevent XSS when injecting into HTML
      const escapeHtml = (str) =>
        String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      const safeMessage = escapeHtml(payload.error.message);
      const safeStack =
        exposeStack && payload.error.stack
          ? `<pre>${escapeHtml(payload.error.stack)}</pre>`
          : "";
      const body = `
        <!doctype html>
        <html>
          <head><meta charset="utf-8"/><title>${title}</title></head>
          <body>
            <h1>${title}</h1>
            <p>${safeMessage}</p>
            ${safeStack}
          </body>
        </html>`;
      res.status(status).type("html").send(body);
      return;
    }

    // default: JSON response
    res.status(status).json(payload);
  };
}

// Export both default and named to keep compatibility with different import styles
module.exports = errorHandlerFactory;
module.exports.errorHandler = errorHandlerFactory;
