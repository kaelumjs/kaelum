---
title: Plugin System
description: Extend Kaelum with reusable plugins.
sidebar:
  order: 2
---

## What is a Plugin?

A plugin is a function that receives the Kaelum app and can add routes, middleware, or config. This lets you encapsulate features into reusable, shareable modules.

```js
function myPlugin(app, options) {
  // add routes, middleware, config — anything app supports
}
```

## Registering Plugins

Use `app.plugin()` to register one or more plugins:

```js
const app = require("kaelum")();

function greetPlugin(app) {
  app.addRoute("/greet", {
    get: (req, res) => res.json({ hello: "world" }),
  });
}

app.plugin(greetPlugin);
app.start(3000);
```

### With Options

Pass an options object as the second argument:

```js
function corsPlugin(app, opts) {
  app.setConfig({ cors: opts.origin || true });
}

app.plugin(corsPlugin, { origin: "https://mysite.com" });
```

### Chaining

`app.plugin()` returns the app, so you can chain:

```js
app
  .plugin(authPlugin)
  .plugin(loggingPlugin)
  .plugin(routesPlugin)
  .start(3000);
```

## Naming Plugins

Kaelum uses the function name for deduplication and debugging. You can also set a custom name via `pluginName`:

```js
// Uses fn.name automatically
function authPlugin(app) { /* ... */ }

// Or set explicitly
const myPlugin = (app) => { /* ... */ };
myPlugin.pluginName = "auth-plugin";
```

### Duplicate Guard

Named plugins can only be registered once. Attempting to register the same named plugin twice throws an error:

```js
app.plugin(authPlugin);
app.plugin(authPlugin); // ❌ Error: "authPlugin" is already registered
```

## Introspection

Use `app.getPlugins()` to list all registered plugin names:

```js
app.plugin(authPlugin);
app.plugin(loggingPlugin);

console.log(app.getPlugins());
// ["authPlugin", "loggingPlugin"]
```

## Creating a Plugin Package

A plugin is just a module that exports a function:

```js
// kaelum-plugin-api-keys/index.js
function apiKeysPlugin(app, opts) {
  const header = opts.header || "x-api-key";

  app.use((req, res, next) => {
    if (!req.headers[header]) {
      return res.status(401).json({ error: "API key required" });
    }
    next();
  });
}

apiKeysPlugin.pluginName = "api-keys";
module.exports = apiKeysPlugin;
```

```js
// Usage
const apiKeys = require("kaelum-plugin-api-keys");
app.plugin(apiKeys, { header: "authorization" });
```
