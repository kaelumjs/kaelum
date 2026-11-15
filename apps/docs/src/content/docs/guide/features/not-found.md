---
title: "Not Found & Method Not Allowed"
description: Handle 404s and 405s elegantly in your Kaelum app.
sidebar:
  order: 5
---

Kaelum provides two handy middlewares to elegantly handle requests for non-existent routes (404) or incorrect methods (405).

## 405 Method Not Allowed

By default in Express, if a client requests `POST /users` but only `GET /users` is defined, the server returns a `404 Not Found`. However, the correct REST response is `405 Method Not Allowed` with an `Allow` header indicating the accepted methods. 

Kaelum fixes this automatically via `app.useMethodNotAllowed()`.

```js
const app = require("kaelum")();

app.addRoute("/users", { get: (req, res) => res.json([]) });

// Must be registered BEFORE notFound() and useErrorHandler()
app.useMethodNotAllowed();
```

When a user triggers a `405`, they receive:
```json
{
  "error": "Method Not Allowed",
  "allowed": ["GET"],
  "path": "/users"
}
```

### Custom 405 Handler

You can provide your own handler:
```js
app.useMethodNotAllowed({
  handler: (req, res, allowedMethods) => {
    res.status(405).json({
      error: "You can't do that here",
      tryTheseInstead: allowedMethods
    });
  }
});
```

---

## 404 Not Found

If a route genuinely doesn't exist, Kaelum can intercept the request before it falls through the void. Just add `app.notFound()` at the end of your route declarations.

```js
app.addRoute("/hello", { get: (req, res) => res.send("Hello") });

// Register as a catch-all at the end
app.notFound();
```

Default response:
```json
{
  "error": "Not Found",
  "path": "/unknown-url"
}
```

### Custom 404 Handler

```js
app.notFound((req, res) => {
  res.status(404).render("404-page", { url: req.path });
});
```

> **Note:** The recommended order for the end of your `app.js` is:
> 1. Your custom routes (`addRoute()`, `apiRoute()`)
> 2. `app.useMethodNotAllowed()`
> 3. `app.notFound()`
> 4. `app.useErrorHandler()`
