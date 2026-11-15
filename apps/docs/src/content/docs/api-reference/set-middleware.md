---
title: "setMiddleware()"
description: Register and manage tracked middleware.
sidebar:
  order: 9
---

## Signature

```js
app.setMiddleware(middleware)
app.setMiddleware([mw1, mw2])
app.setMiddleware(path, middleware)
```

## Parameters

### Global middleware

| Name | Type | Description |
|---|---|---|
| `middleware` | `Function \| Function[]` | Middleware function(s) to register globally. |

### Path-scoped middleware

| Name | Type | Description |
|---|---|---|
| `path` | `string` | URL path to scope the middleware to. |
| `middleware` | `Function \| Function[]` | Middleware function(s) for the path. |

**Returns:** `Array` of registered entries `[{ path, handler }]`.

## Examples

```js
// Single middleware
app.setMiddleware(morgan("dev"));

// Array of middlewares
app.setMiddleware([cors(), helmet(), morgan("dev")]);

// Path-scoped
app.setMiddleware("/admin", authMiddleware);
```

## Tracking & Removal

Kaelum tracks all middleware registered via `setMiddleware()`, enabling programmatic removal:

```js
// List tracked middleware
const list = app.locals._kaelum_middlewares;

// Remove all Kaelum-installed middleware
app.removeMiddleware();

// Remove middleware for a specific path
app.removeMiddleware("/admin");
```

:::note
Only middleware registered via `setMiddleware()` is tracked. Middleware added directly with `app.use()` is not managed by Kaelum.
:::
