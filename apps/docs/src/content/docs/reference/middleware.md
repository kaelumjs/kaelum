---
title: Middleware factories
description: rateLimit, ipRestriction and serveStatic, for part of the app.
sidebar:
  order: 3
---

These factories return Express middleware, for `app.use()` or a route's `use`. Each is also available app-wide through the [options](/guide/configuration/), except `serveStatic`.

## `rateLimit(options?)`

```ts
import { rateLimit } from "kaelum";

app.post("/login", { use: [rateLimit({ max: 5, windowMs: 60_000 })], handler: login });
```

| Option | Type | Default |
| --- | --- | --- |
| `max` | `number` | `100` |
| `windowMs` | `number` | `900000` (15 min) |
| `keyGenerator` | `(req) => string` | `req.ip` |
| `skip` | `(req) => boolean` | never skips |
| `headers` | `boolean` | `true`: `RateLimit-*` and `Retry-After` |
| `statusCode` | `number` | `429` |
| `message` | `string \| object` | standard error body |
| `store` | `RateLimitStore` | in memory |

A custom store implements `increment(key)` (returning `{ totalHits, resetTime }`), `resetKey(key)` and `shutdown()`.

Each call creates its own counter: two routes with separate `rateLimit()` calls are limited separately.

## `ipRestriction(options)`

```ts
import { ipRestriction } from "kaelum";

app.route("/admin", { use: [ipRestriction({ allow: ["10.0.0.0/8"], deny: ["0.0.0.0/0"] })], get: panel });
```

| Option | Type | |
| --- | --- | --- |
| `allow` | `string[]` | IPv4 addresses or CIDR ranges always allowed |
| `deny` | `string[]` | addresses or ranges denied unless allowed |
| `onDenied` | `(req, res) => void` | answer denied requests yourself |

## `serveStatic(root, options?)`

```ts
import { serveStatic } from "kaelum";

app.use(serveStatic("public"));
```

| Option | Default |
| --- | --- |
| `maxAge` | `0`. Milliseconds or a string such as `"1d"` |
| `immutable` | `false` |
| `index` | `"index.html"`; `false` disables |
| `extensions` | none. For example `["html"]` to serve `/about` from `about.html` |
| `dotfiles` | `"ignore"` |
| `fallthrough` | `true`: a missing file passes to the next handler |
