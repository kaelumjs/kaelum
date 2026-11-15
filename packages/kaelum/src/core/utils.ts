// core/utils.js
// Shared utility functions used across Kaelum core modules.

import type { Express, NextFunction, Request, Response } from "express";

/**
 * Remove a middleware function reference from the Express internal router stack.
 * Only removes layers whose handle matches the given function reference.
 *
 * @param {Object} app - Express app instance
 * @param {Function} fn - middleware function reference to remove
 */
function removeMiddlewareByFn(app: Express, fn: unknown) {
  if (
    !app ||
    !app._router ||
    !Array.isArray(app._router.stack)
  )
    return;
  app._router.stack = app._router.stack.filter(
    (layer: { handle: unknown }) => layer.handle !== fn
  );
}

export { removeMiddlewareByFn };
