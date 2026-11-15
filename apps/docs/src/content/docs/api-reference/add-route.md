---
title: "addRoute()"
description: Register routes on the Kaelum application.
sidebar:
  order: 2
---

## Signature

```js
app.addRoute(path, handlers)
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `path` | `string` | Route path (e.g., `'/'`, `'/users'`). |
| `handlers` | `Function \| Object \| Array` | Handler(s) for the route. |

## Patterns

### Simple GET

```js
app.addRoute("/hello", (req, res) => {
  res.send("Hello World");
});
```

### Method Mapping

```js
app.addRoute("/users", {
  get: (req, res) => { /* list */ },
  post: (req, res) => { /* create */ }
});
```

Supported: `get`, `post`, `put`, `delete`, `patch`, `all`.

### Middleware Chains

```js
app.addRoute("/dashboard", {
  get: [authMiddleware, (req, res) => {
    res.send("Secure");
  }]
});
```

### Nested Sub-routes

```js
app.addRoute("/api", {
  get: (req, res) => res.send("API Root"),
  "/status": {
    get: (req, res) => res.json({ status: "ok" })
  }
});
```

:::note
All handlers are wrapped in try/catch. Async errors are automatically caught.
:::
