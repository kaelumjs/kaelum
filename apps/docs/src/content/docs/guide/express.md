---
title: Using with Express
description: Express middleware, the underlying Express app, static files, views and adopting Kaelum inside an existing Express app.
sidebar:
  order: 13
---

Kaelum runs on Express 5 and does not hide it.

## Express middleware

Any Express middleware works with `app.use()` or in a route's `use`. See [Middleware](/guide/middleware/).

## Adopting Kaelum in an existing Express app

`app.handler` is a plain `(req, res)` function. Mount it in the Express app you already have and move routes over one group at a time:

```ts
import express from "express";
import kaelum from "kaelum";

const legacy = express();
legacy.get("/old", oldHandler);

const v2 = kaelum({ health: false, shutdown: false });
v2.route("/users", { get: () => db.users.all() });

legacy.use("/v2", v2.handler); // GET /v2/users is served by Kaelum
legacy.listen(3000);
```

The Kaelum app keeps its own defaults (security headers, error format, validation) for the routes it serves. Turn off `health` and `shutdown` when the outer app already handles them.

It also works with `http.createServer(app.handler)`.

## The Express app

`app.express` is the underlying Express app, for settings Kaelum does not expose:

```ts
app.express.set("json spaces", 2);
app.express.set("etag", "strong");
```

:::caution
Prefer `app.use()` over `app.express.use()`. Middleware added to `app.express` directly runs after Kaelum's 404 and error handlers, so it never sees most requests.
:::

## Static files

Use the [`static` option](/guide/pages/#static-files). For more than one folder, or one mounted conditionally, the middleware is exported:

```ts
import { serveStatic } from "kaelum";

app.use("/downloads", requireUser, serveStatic("private/downloads"));
```

Middleware and routes run in the order they were added, so add `serveStatic` before the routes to serve files first. A missing file falls through to the next handler and, at the end, the 404. Options: `maxAge`, `immutable`, `index`, `extensions`, `dotfiles`, `fallthrough`.

## Views

Use the [`views` option](/guide/pages/#views) and `c.render()`. Any Express view engine works.
