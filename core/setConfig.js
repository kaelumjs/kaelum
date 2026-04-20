// core/setConfig.js
// Kaelum centralized configuration helper.
// - Supports toggling CORS, Helmet, static folder, Morgan logs, bodyParser, and port.
// - Persists merged config to app locals (app.set("kaelum:config", ...)).
// - Keeps references to Kaelum-installed middleware so toggles (false) remove them.

const path = require("path");
const { removeMiddlewareByFn } = require("./utils");

function tryRequire(name) {
  try {
    return require(name);
  } catch (e) {
    return null;
  }
}

/**
 * Merge new options into existing stored config
 * @param {Object} app
 * @param {Object} options
 */
function persistConfig(app, options = {}) {
  const prev = app.locals.kaelumConfig || {};
  const merged = Object.assign({}, prev, options);
  app.locals.kaelumConfig = merged;
  app.set("kaelum:config", merged);
  return merged;
}


/**
 * Remove static middleware previously installed by Kaelum (if any)
 * @param {Object} app
 */
function removeKaelumStatic(app) {
  const prev = app.locals && app.locals._kaelum_static;
  if (prev) {
    removeMiddlewareByFn(app, prev);
    app.locals._kaelum_static = null;
  }
}

/**
 * Remove body parsers previously installed by Kaelum
 * @param {Object} app
 */
function removeKaelumBodyParsers(app) {
  const arr = app.locals && app.locals._kaelum_bodyparsers;
  if (Array.isArray(arr)) {
    arr.forEach((fn) => removeMiddlewareByFn(app, fn));
    app.locals._kaelum_bodyparsers = [];
  }
}

/**
 * Remove morgan logger if previously set
 * @param {Object} app
 */
function removeKaelumLogger(app) {
  const prev = app.locals && app.locals._kaelum_logger;
  if (prev) {
    removeMiddlewareByFn(app, prev);
    app.locals._kaelum_logger = null;
  }
}

/**
 * Remove Kaelum-installed CORS middleware (if any)
 * @param {Object} app
 */
function removeKaelumCors(app) {
  const prev = app.locals && app.locals._kaelum_cors;
  if (prev) {
    removeMiddlewareByFn(app, prev);
    app.locals._kaelum_cors = null;
  }
}

/**
 * Remove Kaelum-installed Helmet middleware (if any)
 * @param {Object} app
 */
function removeKaelumHelmet(app) {
  const prev = app.locals && app.locals._kaelum_helmet;
  if (prev) {
    removeMiddlewareByFn(app, prev);
    app.locals._kaelum_helmet = null;
  }
}

/**
 * Remove Kaelum-installed rate-limiting middleware (if any)
 * Also shuts down the MemoryStore cleanup interval.
 * @param {Object} app
 */
function removeKaelumRateLimit(app) {
  const prev = app.locals && app.locals._kaelum_ratelimit;
  if (prev) {
    // shut down the store's cleanup interval if present
    if (prev._store && typeof prev._store.shutdown === "function") {
      prev._store.shutdown();
    }
    removeMiddlewareByFn(app, prev);
    app.locals._kaelum_ratelimit = null;
  }
}

/**
 * Apply configuration options to the app
 * @param {Object} app - express app instance
 * @param {Object} options - supported keys: cors, helmet, static, logs, port, bodyParser
 */
function setConfig(app, options = {}) {
  if (!app) throw new Error("setConfig requires an app instance");

  // persist/merge config
  const cfg = persistConfig(app, options);

  // --- CORS ---
  if (options.hasOwnProperty("cors")) {
    if (options.cors) {
      const cors = tryRequire("cors");
      const corsOpts = options.cors === true ? {} : options.cors;
      if (!cors) {
        console.warn(
          "Kaelum: cors package not installed. Skipping CORS setup."
        );
      } else {
        // remove previous Kaelum-installed cors if exists
        removeKaelumCors(app);

        // create middleware function and store reference so it can be removed later
        const corsFn = cors(corsOpts);
        app.locals._kaelum_cors = corsFn;
        app.use(corsFn);
        console.log("🛡️  CORS activated.");
      }
    } else {
      // disable Kaelum-installed CORS middleware if present
      removeKaelumCors(app);
      console.log("🛡️  CORS disabled (Kaelum-managed).");
    }
  }

  // --- Helmet ---
  if (options.hasOwnProperty("helmet")) {
    if (options.helmet) {
      const helmet = tryRequire("helmet");
      const helmetOpts = options.helmet === true ? {} : options.helmet;
      if (!helmet) {
        console.warn(
          "Kaelum: helmet package not installed. Skipping Helmet setup."
        );
      } else {
        // remove previous Kaelum-installed helmet if exists
        removeKaelumHelmet(app);

        const helmetFn = helmet(helmetOpts);
        app.locals._kaelum_helmet = helmetFn;
        app.use(helmetFn);
        console.log("🛡️  Helmet activated.");
      }
    } else {
      // disable Kaelum-installed Helmet middleware if present
      removeKaelumHelmet(app);
      console.log("🛡️  Helmet disabled (Kaelum-managed).");
    }
  }

  // --- Static folder handling ---
  if (options.hasOwnProperty("static")) {
    // remove previous Kaelum static
    removeKaelumStatic(app);

    if (options.static) {
      const expressModule = require("express");
      const expressStatic = expressModule.static;
      // resolve to absolute path relative to project root if necessary
      const dir =
        typeof options.static === "string"
          ? path.resolve(process.cwd(), options.static)
          : path.join(process.cwd(), "public");
      const staticFn = expressStatic(dir);
      app.locals._kaelum_static = staticFn;
      app.use(staticFn);
      console.log(`📁 Static files served from ${dir}`);
    } else {
      // static === false -> nothing to add (static removed)
      console.log("📁 Static serving disabled.");
    }
  }

  // --- Body parser toggle ---
  if (options.hasOwnProperty("bodyParser")) {
    if (options.bodyParser === false) {
      // remove Kaelum-installed body parsers
      removeKaelumBodyParsers(app);
      console.log("📦 Body parsers disabled.");
    } else {
      // ensure body parsers are installed (if not present)
      if (
        !app.locals._kaelum_bodyparsers ||
        app.locals._kaelum_bodyparsers.length === 0
      ) {
        const expressModule = require("express");
        const jsonParser = expressModule.json();
        const urlencodedParser = expressModule.urlencoded({
          extended: true,
        });
        app.locals._kaelum_bodyparsers = [jsonParser, urlencodedParser];
        app.use(jsonParser);
        app.use(urlencodedParser);
        console.log("📦 Body parsers enabled (JSON + URL-encoded).");
      }
    }
  }

  // --- Logs (morgan) ---
  if (options.hasOwnProperty("logs")) {
    // remove previous logger first
    removeKaelumLogger(app);

    if (options.logs) {
      const morgan = tryRequire("morgan");
      if (!morgan) {
        console.warn("Kaelum: morgan package not installed. Skipping logs.");
      } else {
        // use provided format string, default to 'dev' when logs: true
        const format = typeof options.logs === "string" ? options.logs : "dev";
        const logger = morgan(format);
        app.locals._kaelum_logger = logger;
        app.use(logger);
        console.log(`📊 Request logging enabled (morgan: ${format}).`);
      }
    } else {
      console.log("📊 Request logging disabled.");
    }
  }

  // --- Port persisted in config (start will read it) ---
  if (options.hasOwnProperty("port")) {
    const p = options.port;
    if (p === false || p === null) {
      // unset
      const merged = Object.assign({}, app.locals.kaelumConfig);
      delete merged.port;
      app.locals.kaelumConfig = merged;
      app.set("kaelum:config", merged);
      console.log("🔌 Port preference cleared from Kaelum config.");
    } else if (typeof p === "number" || typeof p === "string") {
      // persist port as number if possible
      const asNum = Number(p);
      app.locals.kaelumConfig.port = Number.isNaN(asNum) ? p : asNum;
      app.set("kaelum:config", app.locals.kaelumConfig);
      console.log(
        `🔌 Port set to ${app.locals.kaelumConfig.port} in Kaelum config.`
      );
    }
  }

  // --- View Engine ---
  if (options.hasOwnProperty("views")) {
    const v = options.views;
    if (v && typeof v === "object") {
      if (v.engine) {
        app.set("view engine", v.engine);
        console.log(`🎨 View engine set to: ${v.engine}`);
      }
      if (v.path) {
        const p = path.resolve(process.cwd(), v.path);
        app.set("views", p);
        console.log(`🎨 Views directory set to: ${p}`);
      }
    }
  }

  // --- Rate Limiting ---
  if (options.hasOwnProperty("rateLimit")) {
    if (options.rateLimit) {
      const { createRateLimiter } = require("./rateLimit");
      const rateLimitOpts =
        options.rateLimit === true ? {} : options.rateLimit;

      // remove previous Kaelum-installed rate limiter if exists
      removeKaelumRateLimit(app);

      const rateLimitFn = createRateLimiter(rateLimitOpts);
      app.locals._kaelum_ratelimit = rateLimitFn;
      app.use(rateLimitFn);
      console.log("⏱️  Rate limiting activated.");
    } else {
      // disable Kaelum-installed rate limiter if present
      removeKaelumRateLimit(app);
      console.log("⏱️  Rate limiting disabled (Kaelum-managed).");
    }
  }

  // --- Graceful Shutdown ---
  if (options.hasOwnProperty("gracefulShutdown")) {
    const server = app.locals && app.locals._kaelum_server;
    if (server && server.listening) {
      const {
        enableGracefulShutdown,
        removeSignalHandlers,
      } = require("./shutdown");
      if (options.gracefulShutdown === false) {
        removeSignalHandlers(app);
      } else {
        const shutdownOpts =
          typeof options.gracefulShutdown === "object"
            ? options.gracefulShutdown
            : {};
        enableGracefulShutdown(app, shutdownOpts);
      }
    }
  }

  // Return the full merged config for convenience
  return app.locals.kaelumConfig;
}

module.exports = setConfig;
