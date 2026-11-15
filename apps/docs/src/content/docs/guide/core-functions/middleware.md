---
title: Middleware
description: Using and managing middleware in Kaelum.
sidebar:
  order: 1
---

## setMiddleware()

Attach middleware globally to all routes:

```js
const morgan = require("morgan");
app.setMiddleware(morgan("dev"));
```

### Single Middleware

```js
app.setMiddleware(myMiddleware);
```

### Array of Middlewares

```js
app.setMiddleware([cors(), helmet(), morgan("dev")]);
```

### Path-Scoped

```js
app.setMiddleware("/admin", authMiddleware);
```

## Per-Route Middleware

Attach middleware to specific routes using array syntax:

```js
app.addRoute("/dashboard", {
  get: [authMiddleware, (req, res) => {
    res.send("Secure Dashboard");
  }]
});
```

## Middleware Tracking

Kaelum tracks registered middleware, allowing you to list and remove them programmatically:

```js
// List middleware
const list = app.getMiddleware();

// Remove by function reference
app.removeMiddleware(myMiddleware);
```

:::tip
Register middleware **before** adding routes. Middleware executes in the order of registration.
:::
