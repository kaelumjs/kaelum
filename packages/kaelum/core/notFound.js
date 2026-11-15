// core/notFound.js
// Provides middleware for 404 Not Found and 405 Method Not Allowed

/**
 * Creates a 404 Not Found middleware.
 * If a custom handler is provided, it will be called.
 * Otherwise, it defaults to a clean JSON response.
 *
 * @param {Function} [handler] - Custom handler (req, res, next)
 * @returns {Function} Express middleware
 */
function notFound(handler) {
  return function kaelumNotFound(req, res, next) {
    if (typeof handler === "function") {
      return handler(req, res, next);
    }
    res.status(404).json({
      error: "Not Found",
      path: req.path,
    });
  };
}

/**
 * Creates a 405 Method Not Allowed middleware.
 * Should be registered BEFORE the notFound middleware (or usually as a catch-all before 404).
 * It dynamically inspects the Express router stack to see if the requested path exists
 * with other HTTP methods.
 *
 * @param {import('express').Application} app - The Express application
 * @param {Object} [options]
 * @param {Function} [options.handler] - Custom handler (req, res, allowedMethods)
 * @returns {Function} Express middleware
 */
function methodNotAllowed(app, options = {}) {
  return function kaelumMethodNotAllowed(req, res, next) {
    const methods = new Set();

    function traverse(layers, currentPath) {
      for (const layer of layers) {
        if (layer.route) {
          // It's a direct route layer
          if (layer.match(currentPath)) {
            for (const method in layer.route.methods) {
              if (method !== "_all" && layer.route.methods[method]) {
                methods.add(method.toUpperCase());
              }
            }
          }
        } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
          // It's a nested router (e.g., from app.group or express.Router)
          if (layer.match(currentPath)) {
            const matchedPrefix = layer.path;
            let remainingPath = currentPath.slice(matchedPrefix.length);
            if (!remainingPath.startsWith("/")) {
              remainingPath = "/" + remainingPath;
            }
            traverse(layer.handle.stack, remainingPath);
          }
        }
      }
    }

    if (app._router && app._router.stack) {
      traverse(app._router.stack, req.path);
    }

    if (methods.size > 0) {
      // The path exists, but the requested method is not allowed
      const allowedMethods = Array.from(methods);
      if (typeof options.handler === "function") {
        return options.handler(req, res, allowedMethods);
      }
      res.setHeader("Allow", allowedMethods.join(", "));
      return res.status(405).json({
        error: "Method Not Allowed",
        allowed: allowedMethods,
        path: req.path,
      });
    }

    // No route matched this path at all, fall through to 404
    next();
  };
}

module.exports = {
  notFound,
  methodNotAllowed,
};
