---
title: "Trailing Slash"
description: Automatically redirect trailing-slash URLs to their canonical form.
sidebar:
  order: 8
---

Kaelum's trailing slash middleware redirects requests like `/users/` to `/users`, keeping your URLs canonical and consistent. Query strings are preserved in the redirect.

## Usage

```js
const app = require("kaelum")();

app.useTrimTrailingSlash();

app.get("/users", (req, res) => res.json({ users: [] }));
app.start(3000);
```

A request to `GET /users/` will be answered with a `301 Moved Permanently` redirect to `/users`.

## Custom redirect status

```js
app.useTrimTrailingSlash({ status: 308 }); // Permanent Redirect (method-preserving)
app.useTrimTrailingSlash({ status: 307 }); // Temporary Redirect (method-preserving)
```

## Preserving query strings

Query strings are preserved automatically:

```
GET /search/?q=kaelum → 301 → /search?q=kaelum
```

## Via setConfig

```js
app.setConfig({
  trimTrailingSlash: true,           // 301 (default)
  trimTrailingSlash: { status: 308 } // custom status
});
```

> **Note:** The root path `/` is never redirected, even when trailing slash redirect is active.

> **Tip:** Register `useTrimTrailingSlash()` early in your middleware chain, before route definitions, so the redirect fires before Express tries to match any routes.
