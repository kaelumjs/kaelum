---
title: "plugin() & getPlugins()"
description: Extend Kaelum with reusable plugins.
sidebar:
  order: 7
---

## plugin()

### Signature

```js
app.plugin(fn, [options])
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `fn` | `Function` | Plugin function with signature `(app, options) => void`. |
| `options` | `Object` | Optional configuration passed to the plugin. |

**Returns:** `app` (for chaining).

### Examples

```js
function greetPlugin(app) {
  app.addRoute("/greet", {
    get: (req, res) => res.json({ hello: "world" }),
  });
}

app.plugin(greetPlugin);

// With options
app.plugin(corsPlugin, { origin: "https://mysite.com" });

// Chaining
app
  .plugin(authPlugin)
  .plugin(loggingPlugin)
  .start(3000);
```

### Naming & Deduplication

Kaelum uses `fn.name` or `fn.pluginName` for dedup:

```js
app.plugin(authPlugin);
app.plugin(authPlugin); // ❌ throws — already registered
```

Anonymous plugins (arrow functions without names) can be registered multiple times.

---

## getPlugins()

### Signature

```js
app.getPlugins()
```

**Returns:** `string[]` — list of registered plugin names.

### Example

```js
app.plugin(authPlugin);
app.plugin(loggingPlugin);

console.log(app.getPlugins());
// ["authPlugin", "loggingPlugin"]
```
