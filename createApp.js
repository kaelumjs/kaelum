// createApp.js
// Kaelum factory: creates an Express app with Kaelum helpers
// - enables JSON and URL-encoded body parsing by default
// - stores references to parsers and static middleware so they can be replaced by setConfig
// - wraps core/setConfig to support toggles via setConfig({ ... })
// - exposes existing core helpers (start, addRoute, setMiddleware, apiRoute)
// - exposes error handler helper app.useErrorHandler()

require("dotenv").config();
const express = require("express");
const path = require("path");

const start = require("./core/start");
const addRoute = require("./core/addRoute");
const apiRoute = require("./core/apiRoute");
const setMiddleware = require("./core/setMiddleware");
const coreSetConfig = require("./core/setConfig");
const { errorHandler } = require("./core/errorHandler");
const registerHealth = require("./core/healthCheck");
const redirect = require("./core/redirect");
const { removeMiddlewareByFn } = require("./core/utils");

function createApp() {
  const app = express();
  
  // Security: disable x-powered-by header to obfuscate server details
  app.disable("x-powered-by");

  // ensure locals object and initial persisted config
  app.locals = app.locals || {};
  app.locals.kaelumConfig = app.locals.kaelumConfig || {};
  // persist baseline config so app.get("kaelum:config") is always available
  app.set("kaelum:config", app.locals.kaelumConfig);

  // --- Default static middleware (store reference so setConfig can replace it) ---
  const defaultStatic = express.static(path.join(process.cwd(), "public"));
  app.locals._kaelum_static = defaultStatic;
  app.use(defaultStatic);

  // --- Body parsers (enabled by default) ---
  const jsonParser = express.json();
  const urlencodedParser = express.urlencoded({ extended: true });

  // Keep references so we can remove them later if requested
  app.locals._kaelum_bodyparsers = [jsonParser, urlencodedParser];

  // Apply them by default
  app.use(jsonParser);
  app.use(urlencodedParser);

  // --- View Engine (EJS) ---
  // Set EJS as the default view engine and point to ./views
  app.set("view engine", "ejs");
  app.set("views", "./views");

  // --- wrapper for core.setConfig ---
  app.setConfig = function (options = {}) {
    // call core setConfig if available (it should persist merged config)
    try {
      const merged = coreSetConfig(app, options);
      // ensure merged config is persisted locally as well
      if (merged && typeof merged === "object") {
        app.locals.kaelumConfig = merged;
        app.set("kaelum:config", merged);
      }
    } catch (e) {
      // fallback merge and persist locally
      const prev = app.locals.kaelumConfig || {};
      app.locals.kaelumConfig = Object.assign({}, prev, options);
      app.set("kaelum:config", app.locals.kaelumConfig);
    }

    // read merged config
    const cfg = app.get("kaelum:config") || app.locals.kaelumConfig || {};

    // Body parser toggle handled by core.setConfig (which manipulates app._router.stack)
    return cfg;
  };

  // convenience getter
  app.getKaelumConfig = function () {
    return app.get("kaelum:config") || app.locals.kaelumConfig || {};
  };

  // convenience wrapper to set static folder directly
  app.static = function (dir) {
    if (!dir) {
      // if no dir passed, act as getter
      return app.getKaelumConfig().static || null;
    }
    return app.setConfig({ static: dir });
  };

  // convenience method to remove static middleware
  app.removeStatic = function () {
    return app.setConfig({ static: false });
  };

  // ---------------------------
  // middleware utility helpers
  // ---------------------------

  // removeMiddlewareByFn imported from core/utils.js

  // ---------------------------
  // bind existing core helpers to the app
  // ---------------------------
  if (typeof start === "function") {
    app.start = function (port, cb) {
      return start(app, port, cb);
    };
  }

  if (typeof addRoute === "function") {
    app.addRoute = function (routePath, handlers) {
      return addRoute(app, routePath, handlers);
    };
  }

  if (typeof apiRoute === "function") {
    app.apiRoute = function (resource, handlers) {
      return apiRoute(app, resource, handlers);
    };
  }

  if (typeof setMiddleware === "function") {
    app.setMiddleware = function (middlewareOrPath, maybeMiddleware) {
      // forward call to core/setMiddleware - keep signature flexible
      if (arguments.length === 2) {
        return setMiddleware(app, middlewareOrPath, maybeMiddleware);
      }
      return setMiddleware(app, middlewareOrPath);
    };
  }

  if (typeof registerHealth === "function") {
    app.healthCheck = function (routePath = "/health") {
      registerHealth(app, routePath);
      return app;
    };
  }

  if (typeof redirect === "function") {
    app.redirect = function (from, to, status = 302) {
      return redirect(app, from, to, status);
    };
  }

  // ---------------------------
  // Error handler exposure
  // ---------------------------
  // Expose a convenience method to register Kaelum's generic error handler.
  // Accepts same options as errorHandler factory: { exposeStack: boolean }
  app.useErrorHandler = function (options = {}) {
    // If an error handler was previously registered by Kaelum, remove it first.
    if (app.locals && app.locals._kaelum_errorhandler) {
      removeMiddlewareByFn(app, app.locals._kaelum_errorhandler);
      app.locals._kaelum_errorhandler = null;
    }

    const mw = errorHandler(options);
    // store reference and install as final middleware
    if (!app.locals) app.locals = {};
    app.locals._kaelum_errorhandler = mw;
    app.use(mw);
    return app;
  };

  // alias for convenience
  app.errorHandler = app.useErrorHandler;

  return app;
}

module.exports = createApp;
