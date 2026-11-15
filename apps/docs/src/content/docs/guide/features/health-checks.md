---
title: Health Checks
description: Built-in health monitoring for production apps.
sidebar:
  order: 1
---

## healthCheck()

Add a health check endpoint for monitoring and DevOps:

```js
app.healthCheck();          // default: GET /health
app.healthCheck("/status"); // custom path
```

### Response

```json
{
  "status": "OK",
  "uptime": 123.456,
  "pid": 12345,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### With Readiness Check

```js
app.healthCheck({
  readinessCheck: async () => {
    const dbOk = await checkDatabase();
    return { ok: dbOk };
  }
});
```

Returns **200 OK** when healthy, **503 Service Unavailable** if the readiness check fails.

### Options

| Option | Type | Description |
|---|---|---|
| `path` | `string` | Custom endpoint path (default: `/health`) |
| `readinessCheck` | `Function` | Async function returning `{ ok: boolean }` |
| `replace` | `boolean` | Replace existing health endpoint (default: `false`) |
| `include` | `Object` | Toggle response fields: `uptime`, `pid`, `env`, `timestamp`, `metrics` |

:::tip
Register the health check **before** `useErrorHandler()` so it's reachable even if other routes fail.
:::
