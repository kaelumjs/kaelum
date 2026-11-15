// core/plugin.js
// Kaelum plugin registration system.
// Plugins are functions that receive (app, options) and can add routes,
// middleware, and config to the Kaelum app instance.

/**
 * Resolve the display name and dedup key for a plugin function.
 * Checks fn.pluginName first, then fn.name, falls back to null (anonymous).
 * @param {Function} fn
 * @returns {string|null}
 */
function resolvePluginName(fn) {
  if (typeof fn.pluginName === "string" && fn.pluginName) {
    return fn.pluginName;
  }
  if (typeof fn.name === "string" && fn.name) {
    return fn.name;
  }
  return null;
}

/**
 * Register a plugin on the Kaelum app.
 *
 * @param {Object} app - Kaelum/Express app instance
 * @param {Function} fn - Plugin function with signature (app, options) => void
 * @param {Object} [options={}] - Options passed to the plugin
 * @returns {Object} app - for chaining
 * @throws {Error} if fn is not a function
 * @throws {Error} if a named plugin with the same name is already registered
 */
function registerPlugin(app, fn, options = {}) {
  if (typeof fn !== "function") {
    throw new Error(
      `Kaelum plugin: expected a function, got ${typeof fn}`
    );
  }

  // ensure registry exists
  if (!app.locals) app.locals = {};
  if (!Array.isArray(app.locals._kaelum_plugins)) {
    app.locals._kaelum_plugins = [];
  }

  const name = resolvePluginName(fn);

  // duplicate guard for named plugins
  if (name) {
    const already = app.locals._kaelum_plugins.find((p) => p.name === name);
    if (already) {
      throw new Error(
        `Kaelum plugin: "${name}" is already registered. ` +
          `Each named plugin can only be registered once.`
      );
    }
  }

  // execute the plugin
  fn(app, options);

  // record in registry
  app.locals._kaelum_plugins.push({
    name: name || `anonymous_${app.locals._kaelum_plugins.length}`,
    options,
  });

  return app;
}

/**
 * Return the list of registered plugin names.
 * @param {Object} app
 * @returns {string[]}
 */
function getPlugins(app) {
  if (!app.locals || !Array.isArray(app.locals._kaelum_plugins)) {
    return [];
  }
  return app.locals._kaelum_plugins.map((p) => p.name);
}

module.exports = { registerPlugin, getPlugins };
