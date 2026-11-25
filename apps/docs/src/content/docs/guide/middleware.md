---
title: Middleware
description: Adding Express middleware to the whole app, a path prefix, a subtree or one endpoint.
sidebar:
  order: 7
---

Middleware in Kaelum is plain Express middleware, `(req, res, next) => void`. Anything from the Express ecosystem works.

## Where middleware can go

```ts
import compression from "compression";

// Whole app
app.use(compression());

// Every path under a prefix
app.use("/admin", requireAdmin);

// A subtree: this level and everything below it
app.route("/billing", {
  use: [requireLogin],
  get: listInvoices,
  "/:id": { get: getInvoice },
});

// One endpoint
app.route("/reports", {
  post: { use: [requireAdmin], handler: createReport },
});
```

Order inside a route: the tree's `use` from the outermost level inward, then the endpoint's own `use`, then validation, then the handler. A middleware that answers (for example with a `401`) stops the chain.

`app.use()` can be called at any time: middleware added after the routes still runs before Kaelum's 404 and error handlers.

## Writing one

```ts
import type { Middleware } from "kaelum";

export const requireApiKey: Middleware = (req, res, next) => {
  if (req.get("x-api-key") !== process.env.API_KEY) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid API key" } });
    return;
  }
  next();
};
```

Async middleware works: a rejected promise is treated like `next(err)`.

To hand data to the handler, put it on `res.locals` and read it with `c.res.raw.locals`. See [Context](/guide/context/#per-request-values).

## Built-in middleware

Kaelum installs its own middleware before anything you add, in this order:

1. request ID
2. request log
3. Server-Timing (off by default)
4. security headers (Helmet)
5. CORS (off by default)
6. trailing slash and redirects (off by default)
7. pretty JSON on `?pretty` (off by default)
8. IP restriction (off by default)
9. rate limit (off by default)
10. CSRF (off by default)
11. static files (off by default)
12. body parsers

Redirects answer before anything else has to run, and checks that can reject a request cheaply come before the body is read. All of these are configured through the [options](/guide/configuration/).

## Middleware factories

Some built-in middleware is also exported for use on part of the app:

```ts
import { ipRestriction, rateLimit, serveStatic } from "kaelum";

app.post("/login", { use: [rateLimit({ max: 5, windowMs: 60_000 })], handler: login });
app.route("/internal", { use: [ipRestriction({ allow: ["10.0.0.0/8"], deny: ["0.0.0.0/0"] })], get: stats });
app.use("/assets", serveStatic("public", { maxAge: "1y", immutable: true }));
```

See the [middleware reference](/reference/middleware/).
