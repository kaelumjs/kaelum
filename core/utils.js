// core/utils.js
// Shared utility functions used across Kaelum core modules.

/**
 * Remove a middleware function reference from the Express internal router stack.
 * Only removes layers whose handle matches the given function reference.
 *
 * @param {Object} app - Express app instance
 * @param {Function} fn - middleware function reference to remove
 */
function removeMiddlewareByFn(app, fn) {
  if (
    !app ||
    !app._router ||
    !Array.isArray(app._router.stack)
  )
    return;
  app._router.stack = app._router.stack.filter(
    (layer) => layer.handle !== fn
  );
}

module.exports = { removeMiddlewareByFn };
