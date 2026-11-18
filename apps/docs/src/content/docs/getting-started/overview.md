---
title: Overview
description: What Kaelum is, what it adds on top of Express and when to use it.
sidebar:
  order: 1
---

Kaelum is Express with the production setup already done. One call gives you security headers, a body size limit, request IDs, request logs, a health check, graceful shutdown and one JSON error format. Routes are declared as a tree, and every handler gets a typed context, `c`.

```ts
import kaelum, { k } from "kaelum";

const app = kaelum();

app.route("/users", {
  get: () => db.users.all(),

  post: {
    body: k.object({ name: k.string(), email: k.string().email() }),
    handler: (c) => c.created(db.users.create(c.body)),
  },

  "/:id": {
    get: (c) => db.users.find(c.params.id),
  },
});

await app.start(3000);
```

## What you get

| | Express | Kaelum |
| --- | --- | --- |
| Security headers | install and wire `helmet` | on by default |
| Body size limit | configure each parser | on, 100 kb |
| Request IDs and logs | pick and wire libraries | on by default |
| Health check | write a route | `GET /health` |
| Graceful shutdown | handle signals yourself | on by default |
| Error responses | each handler decides | always `{ error: { code, message } }` |
| Validation | pick a library and wire it | `body`, `query`, `params` schemas on the route |
| Types for params and body | write them by hand | inferred from the path and the schema |
| 405 and `Allow` | not built in | automatic |

## Still Express

Kaelum runs on Express 5 and keeps it reachable:

- any Express middleware works with `app.use()` or in a route's `use`;
- `app.express` is the underlying Express app;
- `app.handler` mounts a Kaelum app inside an existing Express app, so you can adopt it one route group at a time. See [Using with Express](/guide/express/).

## Requirements

- Node.js 24.22.1 or later.
- Kaelum is ESM. CommonJS code can load it with `require("kaelum")`, through Node's `require(esm)`.
- TypeScript is optional. With it, path params, validated bodies and queries are typed without writing generics.

:::caution[Alpha]
Kaelum 2.0 is in alpha: the API may still change between alpha releases. Coming from 1.x? See [Migrating from 1.x](/getting-started/migrating-from-1x/).
:::
