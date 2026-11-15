---
title: Redirects
description: Simplified URL redirection with multiple syntax options.
sidebar:
  order: 5
---

## redirect()

Kaelum provides a flexible redirect helper that supports single, map, and array syntax.

### Single Redirect

```js
app.redirect("/old", "/new");

// With custom status code (default: 302)
app.redirect("/legacy", "/modern", 301);
```

### Map Syntax

Redirect multiple paths at once using an object:

```js
app.redirect({
  "/old-page": "/new-page",
  "/deprecated": "/current",
});
```

All map redirects use **302** by default.

### Array Syntax

For fine-grained control over each redirect:

```js
app.redirect([
  { from: "/a", to: "/b" },
  { from: "/c", to: "/d", status: 301 },
]);
```

### Safe Replacement

Calling `redirect()` for a path that already has a Kaelum redirect **replaces** the previous handler — no duplicate routes.

:::note
Redirects are registered as `GET` routes. For `POST` redirects, use Express's built-in `res.redirect()` inside your handler.
:::
