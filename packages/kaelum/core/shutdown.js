// core/shutdown.js
// Kaelum graceful shutdown module.
// Handles process signal interception, connection draining, and cleanup hook execution.

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_SIGNALS = ["SIGTERM", "SIGINT"];

/**
 * Register a cleanup function to run during shutdown.
 */
function onShutdown(app, fn) {
  if (!app) throw new Error("onShutdown requires an app instance");
  if (typeof fn !== "function") {
    throw new Error("onShutdown: expected a function, got " + typeof fn);
  }

  if (!Array.isArray(app.locals._kaelum_shutdown_hooks)) {
    app.locals._kaelum_shutdown_hooks = [];
  }

  app.locals._kaelum_shutdown_hooks.push(fn);
  return app;
}

/**
 * Run all registered cleanup hooks in order.
 * Errors in individual hooks are caught and logged but do not abort the sequence.
 */
async function runCleanupHooks(app) {
  const hooks = (app.locals && app.locals._kaelum_shutdown_hooks) || [];
  for (const fn of hooks) {
    try {
      await Promise.resolve(fn());
    } catch (err) {
      console.error(
        "Kaelum shutdown: cleanup hook error:",
        err && err.message ? err.message : err
      );
    }
  }
}

/**
 * Gracefully close the server and run cleanup hooks.
 *
 * If callback is provided: calls cb(err) and returns app.
 * If no callback: returns a Promise<void>.
 */
function close(app, cb) {
  if (!app) throw new Error("close requires an app instance");

  // Prevent double-shutdown
  if (app.locals._kaelum_shutdown_in_progress) {
    if (typeof cb === "function") {
      process.nextTick(() => cb());
      return app;
    }
    return Promise.resolve();
  }

  app.locals._kaelum_shutdown_in_progress = true;

  const timeout = app.locals._kaelum_shutdown_timeout || DEFAULT_TIMEOUT;
  const server = app.locals._kaelum_server;

  // Remove signal handlers to prevent re-entry
  removeSignalHandlers(app);

  const doShutdown = async () => {
    try {
      // Phase 1: close the HTTP server (drain existing connections)
      if (server && typeof server.close === "function") {
        await new Promise((resolve) => {
          const timer = setTimeout(() => {
            console.error(
              "Kaelum shutdown: server close timed out after " + timeout + "ms"
            );
            resolve();
          }, timeout);
          if (timer.unref) timer.unref();

          server.close((err) => {
            clearTimeout(timer);
            if (err) {
              console.error(
                "Kaelum shutdown: server close error:",
                err.message || err
              );
            }
            resolve();
          });
        });
      }

      // Phase 2: run cleanup hooks (always runs, even after timeout)
      await runCleanupHooks(app);
    } finally {
      app.locals._kaelum_shutdown_in_progress = false;
    }
  };

  if (typeof cb === "function") {
    doShutdown()
      .then(() => cb(null))
      .catch((err) => cb(err));
    return app;
  }

  return doShutdown();
}

/**
 * Register process signal handlers for automatic graceful shutdown.
 * Called internally from start.js after server creation.
 */
function enableGracefulShutdown(app, options) {
  if (!app) return;

  const cfg = typeof options === "object" && options !== null ? options : {};
  const timeout = cfg.timeout || DEFAULT_TIMEOUT;
  const signals = Array.isArray(cfg.signals) ? cfg.signals : DEFAULT_SIGNALS;

  app.locals._kaelum_shutdown_timeout = timeout;

  // Remove existing handlers before registering new ones
  removeSignalHandlers(app);

  const handlers = {};

  for (const signal of signals) {
    const handler = () => {
      console.log(
        "\nKaelum: received " + signal + ", starting graceful shutdown..."
      );
      close(app)
        .then(() => process.exit(0))
        .catch((err) => {
          console.error("Kaelum shutdown error:", err.message || err);
          process.exit(1);
        });
    };
    handlers[signal] = handler;
    process.on(signal, handler);
  }

  app.locals._kaelum_shutdown_handlers = handlers;
}

/**
 * Remove signal handlers previously installed by enableGracefulShutdown.
 */
function removeSignalHandlers(app) {
  const handlers = app.locals && app.locals._kaelum_shutdown_handlers;
  if (handlers && typeof handlers === "object") {
    for (const signal of Object.keys(handlers)) {
      process.removeListener(signal, handlers[signal]);
    }
    app.locals._kaelum_shutdown_handlers = null;
  }
}

module.exports = {
  onShutdown,
  close,
  enableGracefulShutdown,
  removeSignalHandlers,
};
