// core/apiRoute.js
// Provide a simple helper to create RESTful resource routes.
// Internally uses addRoute(app, basePath, handlers).
// Supports:
// - handlers as a single function (assumed GET on collection)
// - handlers as an object mapping methods and/or nested subpaths
// - shorthand CRUD generation: pass { crud: true } or { crud: { list, create, show, update, remove } }

const addRoute = require("./addRoute");

/**
 * Normalize resource into a base path string.
 * @param {string} resource
 * @returns {string} normalized path starting with '/'
 */
function normalizeResource(resource) {
  if (!resource) return "/";
  if (typeof resource !== "string") {
    throw new Error("resource must be a string");
  }
  let r = resource.trim();
  if (!r.startsWith("/")) r = "/" + r;
  if (r.length > 1 && r.endsWith("/")) r = r.slice(0, -1);
  return r;
}

/**
 * Create a stub handler returning 501 Not Implemented.
 * @param {string} actionName
 * @returns {Function} express handler
 */
function notImplementedHandler(actionName) {
  return (req, res) => {
    res
      .status(501)
      .json({ error: "Not Implemented", action: actionName || "unknown" });
  };
}

/**
 * Build handlers object for CRUD shorthand.
 * Accepts optional mapping of handler functions.
 *
 * Expected keys supported in `h` (any subset):
 *  - list / index        -> GET /resource
 *  - create              -> POST /resource
 *  - show / get / getById -> GET /resource/:id
 *  - update              -> PUT /resource/:id
 *  - remove / delete     -> DELETE /resource/:id
 *
 * @param {Object|boolean} h - handlers or true to auto-generate stubs
 * @returns {Object} handlers object consumable by addRoute
 */
function buildCrudHandlers(h) {
  const provided = h && typeof h === "object" ? h : {};
  const pick = (keys) => {
    for (const k of keys) {
      if (typeof provided[k] === "function") return provided[k];
    }
    return null;
  };

  const listFn = pick(["list", "index"]);
  const createFn = pick(["create"]);
  const showFn = pick(["show", "get", "getById"]);
  const updateFn = pick(["update"]);
  const removeFn = pick(["remove", "delete"]);

  const handlers = {};

  // collection endpoints
  handlers.get = listFn || notImplementedHandler("list");
  handlers.post = createFn || notImplementedHandler("create");

  // member endpoints under '/:id'
  handlers["/:id"] = {
    get: showFn || notImplementedHandler("show"),
    put: updateFn || notImplementedHandler("update"),
    delete: removeFn || notImplementedHandler("remove"),
  };

  return handlers;
}

/**
 * apiRoute(app, resource, handlers)
 * @param {Object} app - Express app (Kaelum app)
 * @param {string} resource - resource name or path (e.g. 'users' or '/users')
 * @param {Function|Object|boolean} handlers - function, object or shorthand (see README)
 */
function apiRoute(app, resource, handlers = {}) {
  if (!app || typeof app.use !== "function") {
    throw new Error("Invalid app instance: cannot register apiRoute");
  }

  const basePath = normalizeResource(resource);

  // If handlers is a function, assume it's a GET on basePath
  if (typeof handlers === "function") {
    addRoute(app, basePath, handlers);
    return;
  }

  // If handlers is boolean true -> auto CRUD stubs
  if (handlers === true) {
    const crudHandlers = buildCrudHandlers(true);
    addRoute(app, basePath, crudHandlers);
    return;
  }

  // If handlers is an object and has a 'crud' key, use it
  if (
    handlers &&
    typeof handlers === "object" &&
    handlers.hasOwnProperty("crud")
  ) {
    const crudSpec = handlers.crud;
    const crudHandlers = buildCrudHandlers(crudSpec);
    addRoute(app, basePath, crudHandlers);
    return;
  }

  // If handlers is an object, assume it's the direct handlers map for addRoute
  if (handlers && typeof handlers === "object") {
    addRoute(app, basePath, handlers);
    return;
  }

  // anything else is invalid
  throw new Error(
    "Handlers must be a function, an object, or boolean true for CRUD shorthand"
  );
}

module.exports = apiRoute;
