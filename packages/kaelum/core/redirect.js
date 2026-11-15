// core/redirect.js
// Kaelum - redirect helper
//
// This module provides a flexible helper to register one or many redirect routes
// in a Kaelum/Express app. It stores references to Kaelum-installed redirect
// handlers so future calls can remove only the handlers Kaelum created (safe removal).
//
// Usage examples:
//   const redirect = require('./core/redirect');
//   // simple single redirect
//   redirect(app, '/old', '/new', 301);
//
//   // as map (object)
//   redirect(app, { '/old': '/new', '/a': '/b' });
//
//   // as array of objects
//   redirect(app, [
//     { from: '/x', to: '/y', status: 302 },
//     { from: '/a', to: '/b' }
//   ]);
//
//   // returns array of registered entries or null if nothing registered.

function normalizePath(p) {
  if (!p) return "/";
  if (typeof p !== "string") throw new Error("path must be a string");
  return p.startsWith("/") ? p : "/" + p;
}

function normalizeStatus(s) {
  const n = Number(s);
  if (!Number.isFinite(n)) return 302;
  // limit to common redirect codes 300-399
  if (n < 300 || n >= 400) return 302;
  return Math.floor(n);
}

function ensureLocals(app) {
  app.locals = app.locals || {};
  app.locals._kaelum_redirects = app.locals._kaelum_redirects || [];
}

/**
 * Safely remove a previously registered Kaelum redirect handler for a path.
 * Only removes handlers that we registered (tracked in app.locals._kaelum_redirects).
 * @param {Object} app
 * @param {string} path
 */
function removeKaelumRedirectsForPath(app, path) {
  if (!app || !app._router || !Array.isArray(app._router.stack)) return;
  if (!app.locals || !Array.isArray(app.locals._kaelum_redirects)) return;

  // find tracked entries for this path
  const tracked = app.locals._kaelum_redirects.filter((r) => r.path === path);
  if (tracked.length === 0) return;

  // remove router layers whose handler matches tracked.handler
  app._router.stack = app._router.stack.filter((layer) => {
    // keep everything that is not a route
    if (!layer || !layer.route) return true;
    if (layer.route.path !== path) return true;
    // check if route stack contains a tracked handler
    const handlers = layer.route.stack || [];
    for (const entry of tracked) {
      for (const h of handlers) {
        if (h && h.handle === entry.handler) {
          // drop this layer (do not keep)
          return false;
        }
      }
    }
    // if none of the tracked handlers matched, keep the layer
    return true;
  });

  // remove tracked entries for that path from locals
  app.locals._kaelum_redirects = app.locals._kaelum_redirects.filter(
    (r) => r.path !== path
  );
}

/**
 * Register a single redirect handler and track it in app.locals.
 * @param {Object} app
 * @param {string} from
 * @param {string} to
 * @param {number} status
 * @returns {{ path: string, to: string, status: number }}
 */
function registerSingleRedirect(app, from, to, status) {
  const path = normalizePath(from);
  const target = to;
  const code = normalizeStatus(status);

  // create handler and register GET route
  const handler = function (req, res) {
    res.redirect(code, target);
  };

  // add to express
  app.get(path, handler);

  // track it
  ensureLocals(app);
  app.locals._kaelum_redirects.push({
    path,
    handler,
    to: target,
    status: code,
  });

  return { path, to: target, status: code };
}

/**
 * Main redirect export.
 * Accepts:
 *  - (app, from, to, status?)
 *  - (app, mapObject) where mapObject is { from: to, ... }
 *  - (app, array) where array contains { from, to, status? } entries
 *
 * @param {Object} app - Express/Kaelum app
 * @param {string|Object|Array} fromOrMap - path string or map/object or array of mappings
 * @param {string|number} [toOrStatus] - when calling with (app, from, to, status) this is the "to" parameter
 * @param {number} [maybeStatus] - optional status when calling the 4-arg form
 * @returns {Array|null} list of registered redirect entries or null if none
 */
function redirect(app, fromOrMap, toOrStatus, maybeStatus) {
  if (!app || typeof app.get !== "function") {
    throw new Error("Invalid app instance: cannot register redirect");
  }

  ensureLocals(app);

  const registered = [];

  // Helper: register one mapping (and remove previous Kaelum mapping for that path)
  function applyMapping(from, to, status) {
    const path = normalizePath(from);
    // remove previously Kaelum-registered redirects for same path (safe removal)
    removeKaelumRedirectsForPath(app, path);
    // register and track
    const res = registerSingleRedirect(app, path, to, status);
    registered.push(res);
  }

  // Determine input shape
  if (typeof fromOrMap === "string") {
    // form: redirect(app, '/old', '/new', 302)
    const from = fromOrMap;
    const to = typeof toOrStatus === "string" ? toOrStatus : "/";
    const status =
      typeof maybeStatus !== "undefined" ? maybeStatus : toOrStatus;
    applyMapping(from, to, status);
  } else if (Array.isArray(fromOrMap)) {
    // array of objects: [{ from, to, status }]
    for (const item of fromOrMap) {
      if (!item) continue;
      const from = item.from || item.path || null;
      const to = item.to || item.target || null;
      const status = item.status || item.code || 302;
      if (!from || !to) continue;
      applyMapping(from, to, status);
    }
  } else if (fromOrMap && typeof fromOrMap === "object") {
    // object map: { '/old': '/new', 'a': 'b' }
    for (const k of Object.keys(fromOrMap)) {
      applyMapping(k, fromOrMap[k], 302);
    }
  } else {
    throw new Error("Invalid arguments for redirect");
  }

  return registered.length ? registered : null;
}

module.exports = redirect;
