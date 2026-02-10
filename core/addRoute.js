// core/addRoute.js
// Adds routes to an Express app using a flexible handlers object.
// Supports:
// - handlers as a single function (assumed GET)
// - handlers as an object with HTTP methods (get, post, put, delete, patch, all)
// - nested subpaths as keys beginning with '/' (e.g. '/:id': { get: fn })
// - handlers as arrays of functions (middleware chains)

const supportedMethods = ["get", "post", "put", "delete", "patch", "all"];

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Normalize a handler entry into an array of functions.
 * Acceptable inputs: function | [function, function, ...]
 * @param {Function|Function[]} h
 * @returns {Function[]}
 */
function normalizeHandlersToArray(h) {
  if (typeof h === "function") return [h];
  if (Array.isArray(h)) {
    const invalid = h.find((fn) => typeof fn !== "function");
    if (invalid) {
      throw new Error("Each element in handler array must be a function");
    }
    return h;
  }
  throw new Error("Handler must be a function or an array of functions");
}

/**
 * Wrap a handler function to catch thrown errors / rejected promises
 * and forward them to next(err).
 * @param {Function} fn
 * @returns {Function} async wrapper (req, res, next)
 */
function wrapHandler(fn) {
  return async function wrapped(req, res, next) {
    try {
      // support handlers that expect next as third argument
      const maybePromise = fn(req, res, next);
      // if handler returns a promise, await it to catch rejections
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      }
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Join basePath and subKey in a safe manner (avoid duplicate slashes).
 * @param {string} basePath
 * @param {string} key
 * @returns {string}
 */
function joinPaths(basePath, key) {
  if (!basePath.endsWith("/")) basePath = basePath;
  // remove trailing slash from basePath (except if basePath === '/')
  if (basePath !== "/" && basePath.endsWith("/")) {
    basePath = basePath.slice(0, -1);
  }
  // ensure key starts with '/'
  const k = key.startsWith("/") ? key : "/" + key;
  // special case: basePath === '/' -> result is key
  return basePath === "/" ? k : basePath + k;
}

/**
 * Registers routes on the provided Express app.
 * @param {Object} app - Express app instance
 * @param {string} basePath - base route path (e.g. '/users')
 * @param {Function|Object} handlers - single handler function or object map of handlers
 */
function addRoute(app, basePath, handlers = {}) {
  if (!app || typeof app.use !== "function") {
    throw new Error("Invalid app instance: cannot register routes");
  }

  if (typeof basePath !== "string") {
    throw new Error("Invalid path: basePath must be a string");
  }

  // If handlers is a single function, register it as GET
  if (typeof handlers === "function" || Array.isArray(handlers)) {
    const fns = normalizeHandlersToArray(handlers);
    const wrapped = fns.map(wrapHandler);
    app.get(basePath, ...wrapped);
    return;
  }

  if (!isPlainObject(handlers)) {
    throw new Error(
      "Handlers must be a function, an array of functions, or a plain object"
    );
  }

  // Iterate keys of handlers
  for (const key of Object.keys(handlers)) {
    const value = handlers[key];

    // Nested subpath (key starts with '/')
    if (key.startsWith("/")) {
      const subPath = joinPaths(basePath, key);

      // If nested value is a function or array -> assume GET
      if (typeof value === "function" || Array.isArray(value)) {
        const fns = normalizeHandlersToArray(value);
        const wrapped = fns.map(wrapHandler);
        app.get(subPath, ...wrapped);
        continue;
      }

      // If nested value is object -> RECURSE
      if (isPlainObject(value)) {
        addRoute(app, subPath, value);
        continue;
      }

      throw new Error(`Invalid handler for nested path "${subPath}"`);
    }

    // Top-level method keys (like 'get', 'post', 'all', etc.)
    const m = key.toLowerCase();
    if (!supportedMethods.includes(m)) {
      throw new Error(
        `Unsupported key "${key}" in handlers for path "${basePath}"`
      );
    }
    const fn = handlers[key];
    if (typeof fn !== "function" && !Array.isArray(fn)) {
      throw new Error(
        `Handler for ${m.toUpperCase()} ${basePath} must be a function or array of functions`
      );
    }
    const fns = normalizeHandlersToArray(fn);
    const wrapped = fns.map(wrapHandler);
    app[m](basePath, ...wrapped);
  }
}

module.exports = addRoute;