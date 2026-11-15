// core/group.js
// Kaelum - Route Group helper
//
// Creates a sub-context scoped to a given prefix, with optional shared middleware.
// All Kaelum routing helpers (addRoute, apiRoute, redirect, healthCheck) are
// forwarded to an Express Router mounted at the prefix.
//
// Usage:
//   const group = require('./core/group');
//
//   const admin = group(app, '/admin');
//   admin.addRoute('/users', { get: listUsers });
//   // registers: GET /admin/users
//
//   const api = group(app, '/api/v2', authMiddleware);
//   api.apiRoute('products', { get: listProducts });
//   // registers: GET /api/v2/products  (authMiddleware runs first)
//
//   // Nesting:
//   const v2 = group(app, '/api/v2');
//   const products = v2.group('/products');
//   products.addRoute('/', { get: listProducts, post: createProduct });
//   // registers: GET /api/v2/products, POST /api/v2/products

const express = require("express");
const addRoute = require("./addRoute");
const apiRoute = require("./apiRoute");
const redirect = require("./redirect");
const registerHealth = require("./healthCheck");

/**
 * Normalise a prefix: ensure it starts with '/' and has no trailing slash
 * (unless it IS just '/').
 * @param {string} prefix
 * @returns {string}
 */
function normalisePrefix(prefix) {
  if (typeof prefix !== "string" || !prefix.trim()) {
    throw new Error("group: prefix must be a non-empty string");
  }
  let p = prefix.trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

/**
 * Create a route group scoped to `prefix` with optional shared middleware.
 *
 * @param {import('express').Express} app  - Parent Kaelum/Express app
 * @param {string}   prefix               - URL prefix for this group (e.g. '/admin')
 * @param {...Function} middleware         - Optional middleware applied to every route in the group
 * @returns {KaelumGroup}
 */
function group(app, prefix, ...middleware) {
  if (!app || typeof app.use !== "function") {
    throw new Error("group: first argument must be a valid Express app instance");
  }

  const normPrefix = normalisePrefix(prefix);

  // Each group gets its own Express Router so middleware stays scoped
  const router = express.Router();

  // Apply shared middleware to the router (before any routes)
  for (const mw of middleware) {
    if (typeof mw !== "function") {
      throw new Error("group: middleware arguments must be functions");
    }
    router.use(mw);
  }

  // Mount the router on the parent app under the prefix
  app.use(normPrefix, router);

  /**
   * @typedef {Object} KaelumGroup
   * A route group object that exposes the same routing helpers as KaelumApp
   * but scoped to the group's prefix.
   */
  const grp = {
    /** The normalised prefix this group is mounted at. */
    prefix: normPrefix,

    /** The underlying Express Router instance. */
    router,

    /**
     * Register routes within this group.
     * Paths are relative to the group prefix.
     * @param {string} path
     * @param {Function|Object|Array} handlers
     * @returns {KaelumGroup}
     */
    addRoute(path, handlers) {
      addRoute(router, path, handlers);
      return grp;
    },

    /**
     * Register RESTful API routes within this group.
     * @param {string} resource
     * @param {Object|Function|boolean} handlers
     * @returns {KaelumGroup}
     */
    apiRoute(resource, handlers) {
      apiRoute(router, resource, handlers);
      return grp;
    },

    /**
     * Register redirect route(s) within this group.
     * @param {string|Object|Array} from
     * @param {string} [to]
     * @param {number} [status]
     * @returns {KaelumGroup}
     */
    redirect(from, to, status = 302) {
      redirect(router, from, to, status);
      return grp;
    },

    /**
     * Register a health check endpoint within this group.
     * @param {string|Object} [pathOrOpts]
     * @param {Object} [options]
     * @returns {KaelumGroup}
     */
    healthCheck(pathOrOpts, options) {
      registerHealth(router, pathOrOpts, options);
      return grp;
    },

    /**
     * Create a nested sub-group under this group.
     * The sub-group's prefix is relative to the parent group prefix.
     * @param {string} subPrefix
     * @param {...Function} subMiddleware
     * @returns {KaelumGroup}
     */
    group(subPrefix, ...subMiddleware) {
      const normSub = normalisePrefix(subPrefix);

      const subRouter = express.Router();
      for (const mw of subMiddleware) {
        if (typeof mw !== "function") {
          throw new Error("group: nested middleware arguments must be functions");
        }
        subRouter.use(mw);
      }

      router.use(normSub, subRouter);

      // Build a sub-group that delegates to subRouter but still exposes grp API
      return buildSubGroup(subRouter, normPrefix + normSub);
    },
  };

  return grp;
}

/**
 * Build a KaelumGroup object around an already-mounted subRouter.
 * Used internally for nested groups.
 * @param {import('express').Router} router
 * @param {string} fullPrefix
 * @returns {KaelumGroup}
 */
function buildSubGroup(router, fullPrefix) {
  const grp = {
    prefix: fullPrefix,
    router,

    addRoute(path, handlers) {
      addRoute(router, path, handlers);
      return grp;
    },

    apiRoute(resource, handlers) {
      apiRoute(router, resource, handlers);
      return grp;
    },

    redirect(from, to, status = 302) {
      redirect(router, from, to, status);
      return grp;
    },

    healthCheck(pathOrOpts, options) {
      registerHealth(router, pathOrOpts, options);
      return grp;
    },

    group(subPrefix, ...subMiddleware) {
      const normSub = normalisePrefix(subPrefix);
      const subRouter = express.Router();
      for (const mw of subMiddleware) {
        if (typeof mw !== "function") {
          throw new Error("group: nested middleware arguments must be functions");
        }
        subRouter.use(mw);
      }
      router.use(normSub, subRouter);
      return buildSubGroup(subRouter, fullPrefix + normSub);
    },
  };
  return grp;
}

module.exports = group;
