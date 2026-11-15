---
title: Graceful Shutdown
description: Safely shut down your server with connection draining and cleanup hooks.
sidebar:
  order: 3
---

## Overview

Kaelum automatically handles graceful shutdown when `app.start()` is called. On `SIGTERM` or `SIGINT`, the server stops accepting new connections, waits for existing requests to finish, runs your cleanup hooks, and exits cleanly.

This is essential for production deployments on Docker, Kubernetes, Heroku, Railway, and any platform that sends signals to stop processes.

## Default Behavior

Graceful shutdown is **enabled by default** — no configuration needed:

```js
const app = require("kaelum")();

app.start(3000);
// SIGTERM/SIGINT → drains connections → exits cleanly
```

## Cleanup Hooks

Use `app.onShutdown()` to register cleanup functions that run during shutdown. These can be sync or async:

```js
const app = require("kaelum")();

// Close database connection
app.onShutdown(async () => {
  await db.disconnect();
  console.log("Database disconnected");
});

// Close Redis
app.onShutdown(async () => {
  await redis.quit();
  console.log("Redis closed");
});

app.start(3000);
```

Hooks run **sequentially** in registration order. If a hook throws, the error is logged but remaining hooks still execute.

### Chaining

`app.onShutdown()` returns the app, so you can chain:

```js
app
  .onShutdown(() => db.disconnect())
  .onShutdown(() => cache.close())
  .start(3000);
```

## Manual Shutdown

Use `app.close()` to trigger shutdown programmatically:

```js
// Promise API
await app.close();

// Callback API
app.close((err) => {
  if (err) console.error("Shutdown error:", err);
  else console.log("Shut down cleanly");
});
```

`app.close()` is safe to call at any time:
- Before `app.start()` — only runs cleanup hooks (no server to close)
- Multiple calls — idempotent, second call resolves immediately

## Configuration

Customize via `app.setConfig()`:

```js
// Custom timeout (default is 10 seconds)
app.setConfig({
  gracefulShutdown: { timeout: 30000 },
});

// Only handle SIGTERM (not SIGINT)
app.setConfig({
  gracefulShutdown: { signals: ["SIGTERM"] },
});

// Disable entirely
app.setConfig({
  gracefulShutdown: false,
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `timeout` | `number` | `10000` | Max wait time for server to close (ms) |
| `signals` | `string[]` | `["SIGTERM", "SIGINT"]` | Process signals to handle |

## Shutdown Sequence

When a signal is received (or `app.close()` is called):

1. **Stop accepting** new connections
2. **Drain** existing requests (up to configured timeout)
3. **Run cleanup hooks** sequentially
4. **Exit** the process (signal handlers only)

If the server doesn't close within the timeout, shutdown continues — cleanup hooks still run.

## Example: Full Setup

```js
const app = require("kaelum")();

app.setConfig({
  cors: true,
  helmet: true,
  gracefulShutdown: { timeout: 15000 },
});

app.onShutdown(async () => {
  await db.disconnect();
});

app.addRoute("/", {
  get: (req, res) => res.json({ status: "ok" }),
});

app.start(3000);
```
