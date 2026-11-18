---
title: Observability
description: Request IDs, request logs, the logger, Server-Timing and the health check.
sidebar:
  order: 8
---

## Request IDs

Every request gets an ID, returned in the `X-Request-Id` response header and available as `c.id`. When a client or proxy sends a sane `X-Request-Id` (short and printable), it is reused, so one ID can follow a request across services.

```ts
kaelum({
  observability: {
    requestId: { header: "X-Correlation-Id", generate: () => nanoid() },
  },
});
```

Turn it off with `requestId: false`.

## Request logs

One line per request, written when the response finishes:

```
GET /users 200 1.997 ms - 76
```

Default: `"dev"` (colored status) in development, `"tiny"` (same line, no colors) in production, off when `NODE_ENV` is `test`. Set it with `observability.logs`: `true`, `false`, `"dev"` or `"tiny"`.

## Logger

`app.log` and `c.log` have four levels and take an optional object of fields:

```ts
app.log.info("cache warmed", { entries: 1200 });

app.get("/orders/:id", (c) => {
  c.log.debug("loading order", { id: c.params.id });
  // ...
});
```

Records written through `c.log` carry the request ID. Unhandled errors are logged with it too.

By default records go to the console in development, and as one JSON object per line in production, which log collectors can parse:

```json
{"level":"error","time":"2026-11-18T10:21:03.112Z","requestId":"5f0c...","message":"Unhandled error in GET /orders/7","err":{"name":"Error","message":"connection refused","stack":"..."}}
```

To send records elsewhere, pass a sink. It receives `{ level, message, time, requestId?, data? }`:

```ts
import pino from "pino";

const log = pino();

kaelum({
  observability: {
    logger: ({ level, message, requestId, data }) => log[level]({ requestId, ...data }, message),
  },
});
```

## Server-Timing

```ts
kaelum({ observability: { timing: true } });
```

Adds `Server-Timing: total;dur=12.34` to every response. Browser dev tools show it in the network panel. Options: `headerName`, `precision`.

## Health check

`GET /health` answers `{ "status": "ok" }`. Point load balancers and orchestrators at it. Add a readiness check so the instance is taken out of rotation when a dependency is down:

```ts
kaelum({ health: { check: () => db.ping() } });
```

A thrown error or a `false` result answers `503`. See [Configuration](/guide/configuration/#health).
