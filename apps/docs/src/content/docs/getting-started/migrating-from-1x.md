---
title: Migrating from 1.x
description: How the 1.x API maps to Kaelum 2.0.
sidebar:
  order: 3
---

Kaelum 2.0 replaces the 1.x API. The app is no longer an Express app with methods attached: it is a `Kaelum` object, handlers receive a context `c` instead of `(req, res)`, and configuration is passed once to `kaelum()`.

## At a glance

| 1.x | 2.0 |
| --- | --- |
| `const app = require("kaelum")()` | `import kaelum from "kaelum"; const app = kaelum()` |
| `app.setConfig({ ... })` | `kaelum({ ... })`, see [Configuration](/guide/configuration/) |
| `app.addRoute(path, tree)` | `app.route(path, tree)` |
| `app.apiRoute("users", tree)` | `app.route("/users", tree)` or `app.resource("/users", actions)` |
| `app.group(prefix, ...mw)` | a sub-path in the tree with `use` |
| `app.setMiddleware(path, mw)` | `app.use(path, mw)` |
| `(req, res) => res.json(data)` | `(c) => data` |
| `res.ok()`, `res.created()`, ... | `c.ok()`, `c.created()`, ... |
| `validate({ body: { name: { type: "string" } } })` | `body: k.object({ name: k.string() })` |
| `app.healthCheck()` | on by default |
| `app.requestId()`, `app.timing()` | on by default / `observability.timing` |
| `app.useErrorHandler()`, `app.notFound()` | built in |
| `app.useMethodNotAllowed()` | built in |
| `app.onShutdown(fn)` | `app.onClose(fn)` |
| `app.plugin(fn, opts)` | `app.plugin(fn, opts)`, the plugin receives the 2.0 app |
| `kaelum/test` | `kaelum/testing` |
| `.env` loaded on import | `node --env-file-if-exists=.env` |
| `views: { engine: "ejs" }` | `c.html()`, or configure `app.express` (see [Using with Express](/guide/express/#views)) |
| `static: "public"` | `app.use(serveStatic("public"))` |

## Removed

These 1.x features have no direct replacement in 2.0:

- **ETag and pretty JSON options**: use Express settings through `app.express` (`etag`, `json spaces`).
- **Trailing slash redirects and redirect maps**: use `c.redirect()` in a route, or a small middleware.
- **The middleware manager** (tracking and removing middleware at runtime): middleware is added once, at startup.

## A route, before and after

```js
// 1.x
app.apiRoute("users", {
  get: (req, res) => res.json(users),
  post: [validate({ body: { name: { type: "string", required: true } } }), (req, res) => {
    res.status(201).json(create(req.body));
  }],
  "/:id": {
    get: (req, res) => {
      const user = find(req.params.id);
      if (!user) return res.status(404).json({ error: "Not found" });
      res.json(user);
    },
  },
});
```

```ts
// 2.0
app.route("/users", {
  get: () => users,
  post: {
    body: k.object({ name: k.string() }),
    handler: (c) => c.created(create(c.body)),
  },
  "/:id": {
    get: (c) => find(c.params.id) ?? c.notFound(),
  },
});
```

Kaelum 1.x is in maintenance on the [`v1` branch](https://github.com/kaelumjs/kaelum/tree/v1), and every release is listed in the [changelog](/changelog/).
