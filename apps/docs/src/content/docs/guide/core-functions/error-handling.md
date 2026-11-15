---
title: Error Handling
description: Global error handling in Kaelum.
sidebar:
  order: 2
---

## useErrorHandler()

Kaelum provides a global error handler that catches unhandled exceptions across all routes and middleware.

```js
app.useErrorHandler();
```

### With Options

```js
app.useErrorHandler({ exposeStack: false });
```

## How It Works

- Captures unhandled exceptions in routes or middleware
- Returns **JSON** for API endpoints (when `Accept: application/json`)
- Returns **HTML** for web page requests
- Must be called **after** all routes and middleware

## Automatic Async Error Catching

Kaelum wraps all route handlers in a try/catch. Async errors (promise rejections) are automatically caught and passed to Express's `next(err)`:

```js
app.addRoute("/users", {
  get: async (req, res) => {
    const users = await db.getUsers(); // if this throws, it's caught
    res.json(users);
  }
});
```

No need for manual try/catch in every async handler.

## Custom Error Pages

For web apps, you can customize the error response by adding your own error middleware **before** calling `useErrorHandler()`:

```js
app.use((err, req, res, next) => {
  if (req.accepts("html")) {
    res.status(500).render("error", { message: err.message });
  } else {
    next(err); // fallback to Kaelum's handler
  }
});

app.useErrorHandler();
```

:::caution
Always call `useErrorHandler()` **after** all routes and middleware. It must be the last middleware in the chain.
:::
