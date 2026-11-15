// test-utils/index.js
// Kaelum - Testing Helpers
//
// Provides a clean HTTP test client that wraps supertest.
// supertest must be installed as a devDependency in the user's project.
//
// Usage (via subpath export):
//   const { testApp } = require('kaelum/test');
//
//   const client = testApp(app);
//
//   const res = await client.get('/users');
//   const res = await client.post('/users', { body: { name: 'Alice' } });
//   const res = await client.get('/admin', { auth: { bearer: 'token' } });
//   const res = await client.get('/items', { query: { page: 1, limit: 10 } });

"use strict";

/**
 * Lazy-load supertest. If not installed, throw a clear, actionable error.
 * @returns {Function} supertest
 */
function loadSupertest() {
  try {
    return require("supertest");
  } catch {
    throw new Error(
      [
        "kaelum/test requires 'supertest' as a peer dependency.",
        "Install it with:  npm install supertest --save-dev",
      ].join("\n")
    );
  }
}

/**
 * Build a query string from an object and append it to the path.
 * @param {string} path
 * @param {Record<string, any>} [query]
 * @returns {string}
 */
function withQuery(path, query) {
  if (!query || typeof query !== "object" || Object.keys(query).length === 0) {
    return path;
  }
  const qs = Object.entries(query)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return path.includes("?") ? `${path}&${qs}` : `${path}?${qs}`;
}

/**
 * Apply options (body, headers, auth) to a supertest request chain.
 * @param {object} req - supertest request
 * @param {object} options
 * @returns {object} req
 */
function applyOptions(req, options = {}) {
  const { body, headers = {}, auth } = options;

  // Auth shortcuts
  if (auth) {
    if (auth.bearer) {
      req = req.set("Authorization", `Bearer ${auth.bearer}`);
    } else if (auth.basic) {
      const encoded = Buffer.from(auth.basic).toString("base64");
      req = req.set("Authorization", `Basic ${encoded}`);
    }
  }

  // Custom headers
  for (const [key, value] of Object.entries(headers)) {
    req = req.set(key, value);
  }

  // Body (always JSON)
  if (body !== undefined) {
    req = req.set("Content-Type", "application/json").send(body);
  }

  return req;
}

/**
 * Create a test client for the given Kaelum/Express app.
 * Wraps supertest — no server needs to be started.
 *
 * @param {import('express').Express} app
 * @returns {TestClient}
 */
function testApp(app) {
  if (!app || typeof app !== "function") {
    throw new Error("testApp: argument must be a valid Express/Kaelum app instance");
  }

  const supertest = loadSupertest();

  /**
   * Internal request dispatcher.
   * @param {'get'|'post'|'put'|'patch'|'delete'|'head'} method
   * @param {string} path
   * @param {TestClientOptions} [options]
   */
  function dispatch(method, path, options = {}) {
    const fullPath = withQuery(path, options.query);
    const req = supertest(app)[method](fullPath);
    return applyOptions(req, options);
  }

  /**
   * @typedef {Object} TestClientOptions
   * @property {any} [body] - Request body (auto-serialised as JSON)
   * @property {Record<string, string>} [headers] - Additional request headers
   * @property {Record<string, any>} [query] - Query params appended to the path
   * @property {{ bearer?: string, basic?: string }} [auth] - Auth shortcuts
   */

  /**
   * @typedef {Object} TestClient
   */
  return {
    /** HTTP GET */
    get:    (path, options) => dispatch("get",    path, options),
    /** HTTP POST */
    post:   (path, options) => dispatch("post",   path, options),
    /** HTTP PUT */
    put:    (path, options) => dispatch("put",    path, options),
    /** HTTP PATCH */
    patch:  (path, options) => dispatch("patch",  path, options),
    /** HTTP DELETE */
    delete: (path, options) => dispatch("delete", path, options),
    /** HTTP HEAD */
    head:   (path, options) => dispatch("head",   path, options),
  };
}

module.exports = { testApp };
