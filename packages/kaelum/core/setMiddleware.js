// core/setMiddleware.js
// Kaelum middleware manager
//
// - supports:
//   setMiddleware(app, middlewareFn)
//   setMiddleware(app, [mw1, mw2])
//   setMiddleware(app, '/path', middlewareFn)
// - tracks Kaelum-installed middlewares in app.locals._kaelum_middlewares
// - provides removal helper: setMiddleware.remove(app, [path])
//
// Comments / JSDoc in English as requested.

/**
 * Check if value is a function
 * @param {*} v
 * @returns {boolean}
 */
function isFunction(v) {
  return typeof v === "function";
}

/**
 * Ensure app.locals containers exist
 * @param {Object} app
 */
function ensureLocals(app) {
  app.locals = app.locals || {};
  if (!Array.isArray(app.locals._kaelum_middlewares)) {
    app.locals._kaelum_middlewares = [];
  }
}

/**
 * Internal helper: register one middleware (with optional path) and track it.
 * @param {Object} app
 * @param {string|null} path
 * @param {Function} handler
 * @returns {{ path: string|null, handler: Function }}
 */
function registerMiddleware(app, path, handler) {
  if (path) {
    app.use(path, handler);
  } else {
    app.use(handler);
  }

  ensureLocals(app);
  const entry = { path: path || null, handler };
  app.locals._kaelum_middlewares.push(entry);
  return entry;
}

/**
 * Remove Kaelum-installed middlewares for a given path (or all if path==null).
 * Only removes handlers that were registered by Kaelum (tracked in app.locals._kaelum_middlewares).
 * @param {Object} app
 * @param {string|null} path
 */
function removeKaelumMiddlewaresForPath(app, path = null) {
  if (!app || !app._router || !Array.isArray(app._router.stack)) return;

  ensureLocals(app);

  // Filter tracked entries for removal
  const toRemove = app.locals._kaelum_middlewares.filter((e) => {
    if (path === null) return true;
    return e.path === path;
  });

  if (toRemove.length === 0) return;

  // Remove layers whose handler matches any tracked handler for the path
  app._router.stack = app._router.stack.filter((layer) => {
    // keep non-route layers and those that aren't middleware we tracked
    if (!layer || !layer.handle) return true;
    // For mounted middleware, express keeps the handler directly as layer.handle
    for (const entry of toRemove) {
      if (layer.handle === entry.handler) {
        return false; // drop this layer
      }
    }
    return true;
  });

  // remove entries from tracked list
  app.locals._kaelum_middlewares = app.locals._kaelum_middlewares.filter(
    (e) => {
      if (path === null) return false; // remove all
      return e.path !== path;
    }
  );
}

/**
 * setMiddleware - register middleware(s) and track them as Kaelum-installed.
 *
 * Signatures:
 *  - setMiddleware(app, middleware)
 *  - setMiddleware(app, [mw1, mw2])
 *  - setMiddleware(app, path, middleware)
 *
 * Returns array of registered entries: [{ path, handler }, ...]
 *
 * @param {Object} app - Express app
 * @param {string|Function|Array} a - path or middleware or array
 * @param {Function|Array} [b] - middleware or array when a is path
 */
function setMiddleware(app, a, b) {
  if (!app || typeof app.use !== "function") {
    throw new Error("Invalid app instance: cannot apply middleware");
  }

  const registered = [];

  // two args: (app, middlewareOrArray)
  if (arguments.length === 2) {
    const middleware = a;

    if (Array.isArray(middleware)) {
      for (const mw of middleware) {
        if (!isFunction(mw)) {
          throw new Error("All middlewares in array must be functions");
        }
        registered.push(registerMiddleware(app, null, mw));
      }
      return registered;
    }

    if (!isFunction(middleware)) {
      throw new Error("Middleware must be a function or an array of functions");
    }

    registered.push(registerMiddleware(app, null, middleware));
    return registered;
  }

  // three args: (app, path, middleware)
  if (arguments.length === 3) {
    const path = a;
    const middleware = b;

    if (typeof path !== "string") {
      throw new Error(
        "Path must be a string when using three-argument setMiddleware"
      );
    }

    if (Array.isArray(middleware)) {
      for (const mw of middleware) {
        if (!isFunction(mw)) {
          throw new Error("All middlewares in array must be functions");
        }
        registered.push(registerMiddleware(app, path, mw));
      }
      return registered;
    }

    if (!isFunction(middleware)) {
      throw new Error("Middleware must be a function or an array of functions");
    }

    registered.push(registerMiddleware(app, path, middleware));
    return registered;
  }

  throw new Error("Invalid number of arguments for setMiddleware");
}

/**
 * Remove tracked Kaelum middlewares.
 * - setMiddleware.remove(app) => removes all Kaelum-installed middlewares
 * - setMiddleware.remove(app, path) => removes Kaelum-installed middlewares mounted at that path
 *
 * @param {Object} app
 * @param {string} [path]
 */
setMiddleware.remove = function (app, path) {
  if (!app) return;
  if (typeof path !== "undefined" && typeof path !== "string") {
    throw new Error(
      "Path must be a string when provided to setMiddleware.remove"
    );
  }
  removeKaelumMiddlewaresForPath(app, typeof path === "string" ? path : null);
  return app.locals && app.locals._kaelum_middlewares
    ? app.locals._kaelum_middlewares
    : [];
};

module.exports = setMiddleware;
