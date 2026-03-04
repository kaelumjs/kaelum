// core/healthCheck.js
// Kaelum - health check helper
//
// Exports a factory function to register a health (liveness/readiness) endpoint.
//
// Usage examples:
//   const registerHealth = require('./core/healthCheck');
//   // simple
//   registerHealth(app);
//   // with options
//   registerHealth(app, {
//     path: '/health',
//     readinessCheck: async () => {
//       // custom checks (e.g. DB ping). Return { ok: true, details: { ... } } or { ok: false, details: {...} }
//       const ok = await db.ping();
//       return { ok, details: { db: ok } };
//     },
//     include: { uptime: true, pid: true, env: true, timestamp: true },
//     replace: true
//   });

const DEFAULT_PATH = "/health";

/**
 * @typedef {Object} HealthOptions
 * @property {string} [path] - Endpoint path (default '/health')
 * @property {string} [method] - HTTP method for health endpoint (default 'get')
 * @property {boolean} [replace] - If true and a previous Kaelum-installed endpoint exists, replace it (default false)
 * @property {Function} [readinessCheck] - Optional async function that returns { ok: boolean, details?: Object }
 * @property {Object} [include] - Which fields to include in payload. Defaults to all true.
 * @property {boolean} [include.uptime]
 * @property {boolean} [include.pid]
 * @property {boolean} [include.env]
 * @property {boolean} [include.timestamp]
 * @property {boolean} [include.metrics] - reserved for future metrics (default false)
 */

/**
 * Check if the same route path+method already exists in the app router.
 * Only inspects Kaelum-installed layers conservatively.
 * @param {Object} app - express app
 * @param {string} path
 * @param {string} method
 * @returns {boolean}
 */
function routeExists(app, path, method) {
  try {
    if (!app || !app._router || !Array.isArray(app._router.stack)) return false;
    return app._router.stack.some((layer) => {
      if (!layer || !layer.route) return false;
      if (layer.route.path !== path) return false;
      return (
        !!layer.route.methods && !!layer.route.methods[method.toLowerCase()]
      );
    });
  } catch (e) {
    // if internal inspection fails, be conservative and return false
    return false;
  }
}

/**
 * Register a health check endpoint on the provided Express/Kaelum app.
 * @param {Object} app - Express/Kaelum app instance
 * @param {HealthOptions|string} [opts] - options or a string path
 * @returns {Function} the handler function created (useful for tests)
 */
function registerHealth(app, opts = {}) {
  if (!app || typeof app.get !== "function") {
    throw new Error("Invalid app instance: cannot register health check");
  }

  // allow shorthand: passing a string path
  const options =
    typeof opts === "string"
      ? { path: opts }
      : Object.assign(
          {
            path: DEFAULT_PATH,
            method: "get",
            replace: false,
            readinessCheck: null,
            include: {
              uptime: true,
              pid: true,
              env: true,
              timestamp: true,
              metrics: false,
            },
          },
          opts || {}
        );

  // normalize path and method
  let p =
    options.path && typeof options.path === "string"
      ? options.path
      : DEFAULT_PATH;
  if (!p.startsWith("/")) p = "/" + p;
  const method = (options.method || "get").toLowerCase();

  // if route exists and replace is false -> skip registration
  if (routeExists(app, p, method) && !options.replace) {
    return null;
  }

  // if replace requested, attempt to remove prior Kaelum-installed handler
  if (options.replace) {
    try {
      // remove layers that match exactly the route path and method
      if (app._router && Array.isArray(app._router.stack)) {
        app._router.stack = app._router.stack.filter((layer) => {
          if (!layer || !layer.route) return true; // keep non-route layers
          if (layer.route.path !== p) return true; // keep other routes
          // keep only layers that do not match the method we want to replace
          return !layer.route.methods || !layer.route.methods[method];
        });
      }
    } catch (e) {
      // ignore removal errors - continue to register anyway
    }
  } else {
    // if route exists and replace === false we already returned above
  }

  /**
   * The handler performs an optional readinessCheck. If readinessCheck returns
   * { ok: false } then status 503 is sent, otherwise 200.
   * readinessCheck may be synchronous or asynchronous.
   */
  const handler = async (req, res) => {
    // default payload base
    const payload = {
      status: "OK",
    };

    // include optional fields
    const inc = options.include || {};
    if (inc.uptime) payload.uptime = process.uptime();
    if (inc.pid) payload.pid = process.pid;
    if (inc.env) payload.env = process.env.NODE_ENV || "development";
    if (inc.timestamp) payload.timestamp = Date.now();

    // readiness check (optional)
    if (typeof options.readinessCheck === "function") {
      try {
        const result = await Promise.resolve(options.readinessCheck(req));
        // result expected to be { ok: boolean, details?: object } or boolean
        let ok = true;
        let details = undefined;
        if (typeof result === "boolean") {
          ok = result;
        } else if (result && typeof result === "object") {
          ok = !!result.ok;
          details = result.details;
        } else {
          // unrecognized result -> consider as ok
          ok = true;
        }

        if (!ok) {
          payload.status = "FAIL";
          if (details) payload.details = details;
          return res.status(503).json(payload);
        }
      } catch (err) {
        // readiness check threw -> respond 503 with error info (don't expose stack)
        payload.status = "FAIL";
        payload.details = {
          message: err && err.message ? err.message : "readiness check error",
        };
        return res.status(503).json(payload);
      }
    }

    // success
    return res.status(200).json(payload);
  };

  // register route on app
  try {
    // attach a marker so we can detect Kaelum-installed static handlers if needed
    app[method](p, handler);
  } catch (e) {
    throw new Error(
      `Failed to register health route ${method.toUpperCase()} ${p}: ${
        e.message
      }`
    );
  }

  // store reference in locals for future inspection/removal
  try {
    app.locals = app.locals || {};
    app.locals._kaelum_health = app.locals._kaelum_health || [];
    app.locals._kaelum_health.push({ path: p, method, handler });
  } catch (_) {
    // ignore locals storage errors
  }

  return handler;
}

module.exports = registerHealth;
