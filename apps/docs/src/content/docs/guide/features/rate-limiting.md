---
title: Rate Limiting
description: Protect your API from abuse with built-in rate limiting.
---

Kaelum v1.7.0 ships a **zero-dependency in-memory rate limiter** you can
toggle with a single line — the same way you enable `cors` or `helmet`.

## Quick start

```js
const app = require("kaelum")();

app.setConfig({ rateLimit: true });        // 100 req / 15 min / IP
app.addRoute("/api/data", { get: (req, res) => res.json({ ok: true }) });
app.start(3000);
```

## Custom options

Pass an object instead of `true` for granular control:

```js
app.setConfig({
  rateLimit: {
    windowMs: 60 * 1000,   // 1 minute
    max: 30,               // 30 requests per window
    message: "Slow down!",
    statusCode: 429,       // HTTP status (default)
  },
});
```

### All options

| Option         | Type       | Default                        | Description                               |
|----------------|------------|--------------------------------|-------------------------------------------|
| `windowMs`     | `number`   | `900000` (15 min)              | Sliding window in milliseconds            |
| `max`          | `number`   | `100`                          | Max hits per key per window               |
| `message`      | `string \| object` | `{ error: "Too many requests…" }` | Body returned on 429                  |
| `statusCode`   | `number`   | `429`                          | HTTP status when limited                  |
| `keyGenerator` | `function` | `(req) => req.ip`              | Derive the dedup key from the request     |
| `skip`         | `function` | `() => false`                  | Return `true` to bypass limiting          |
| `headers`      | `boolean`  | `true`                         | Send `RateLimit-*` / `Retry-After` headers |
| `store`        | `object`   | built-in `MemoryStore`         | Custom store (see below)                  |

## Disabling

```js
app.setConfig({ rateLimit: false });
```

Removes the middleware **and** shuts down the cleanup timer.

## Response headers

When `headers: true` (default), every response includes:

| Header              | Example     | Description                         |
|---------------------|-------------|-------------------------------------|
| `RateLimit-Limit`   | `100`       | Max requests allowed in the window  |
| `RateLimit-Remaining` | `87`      | Requests left in the current window |
| `RateLimit-Reset`   | `1711036800`| Unix epoch (seconds) when window resets |
| `Retry-After`       | `42`        | Seconds until the client can retry (only on 429) |

## Custom key generator

Rate-limit by API key instead of IP:

```js
app.setConfig({
  rateLimit: {
    keyGenerator: (req) => req.headers["x-api-key"] || req.ip,
  },
});
```

## Skipping certain routes

Let health checks and webhooks through:

```js
app.setConfig({
  rateLimit: {
    skip: (req) => req.path === "/health" || req.path.startsWith("/webhooks/"),
  },
});
```

## Multi-process deployments

:::caution
The built-in `MemoryStore` is **per-process**. In a clustered
environment each worker keeps its own counters, so the effective limit
is multiplied by the number of workers.
:::

For shared state, provide a custom `store` that talks to Redis or a
similar central store.  It must implement three methods:

```js
{
  increment(key)  → { totalHits: number, resetTime: number }
  resetKey(key)   → void
  shutdown()      → void
}
```
