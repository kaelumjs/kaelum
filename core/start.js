// core/start.js
// Start helper for Kaelum: uses port passed or reads from Kaelum config, or falls back to 3000.
// - Validates port number
// - Respects persisted config (app.get("kaelum:config") or app.locals.kaelumConfig)
// - If a server is already running, returns the existing server (no double-listen)
// - Stores the server instance in app.locals._kaelum_server
// - Attaches basic error logging for startup errors

/**
 * Normalize and validate a port-like value.
 * Accepts numbers or numeric strings. Returns integer port.
 * Throws on invalid values.
 * @param {number|string|undefined|null} val
 * @returns {number|undefined}
 */
function normalizePort(val) {
  if (typeof val === "undefined" || val === null || val === "")
    return undefined;
  const p = typeof val === "number" ? val : parseInt(String(val), 10);
  if (Number.isNaN(p) || !Number.isInteger(p)) {
    throw new Error(`Invalid port value: ${val}`);
  }
  if (p < 1 || p > 65535) {
    throw new Error(`Port out of range: ${p} (must be 1-65535)`);
  }
  return p;
}

/**
 * Start the Express app listening on the given port (or config / default).
 * Returns the Node HTTP server instance.
 *
 * @param {Object} app - Express app instance
 * @param {number|string} [port] - optional port override
 * @param {Function} [cb] - optional callback invoked when server starts (signature: () => void)
 * @returns {import('http').Server} server instance
 */
function start(app, port, cb) {
  if (!app) throw new Error("start requires an app instance");

  // read existing persisted config
  const cfg =
    app.get && app.get("kaelum:config")
      ? app.get("kaelum:config")
      : app.locals && app.locals.kaelumConfig
      ? app.locals.kaelumConfig
      : {};

  // determine port precedence: explicit argument -> config -> default
  let usePort;
  try {
    usePort = normalizePort(port);
  } catch (err) {
    throw err;
  }

  if (typeof usePort === "undefined") {
    try {
      usePort = normalizePort(cfg && cfg.port);
    } catch (err) {
      // config had invalid port — surface error
      throw err;
    }
  }

  if (typeof usePort === "undefined") {
    usePort = 3000;
  }

  // ensure app.locals exists
  app.locals = app.locals || {};

  // if server already created and listening, return it (avoid double-listen)
  const existing = app.locals._kaelum_server;
  if (existing && existing.listening) {
    const addr = existing.address && existing.address();
    const runningPort = addr && addr.port ? addr.port : usePort;
    console.warn(
      `Kaelum start: server already running on port ${runningPort} — returning existing server instance.`
    );
    if (typeof cb === "function") {
      // call callback asynchronously to emulate listen callback behaviour
      process.nextTick(cb);
    }
    return existing;
  }

  // Start server and handle errors
  let server;
  try {
    server = app.listen(usePort, () => {
      console.log(`🚀 Kaelum server running at http://localhost:${usePort}`);
      if (typeof cb === "function") cb();
    });
  } catch (err) {
    // synchronous errors are rare; log and rethrow
    console.error("Kaelum start: failed to start server:", err);
    throw err;
  }

  // attach basic error handler for runtime listen errors (e.g., EADDRINUSE)
  server.on("error", (err) => {
    console.error(
      "Kaelum server error:",
      err && err.message ? err.message : err
    );
  });

  // persist reference so we can check or close later
  app.locals._kaelum_server = server;

  return server;
}

module.exports = start;
