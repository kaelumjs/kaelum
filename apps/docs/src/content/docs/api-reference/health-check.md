---
title: "healthCheck()"
description: Built-in health monitoring endpoint.
sidebar:
  order: 5
---

## Signature

```js
app.healthCheck([pathOrOptions])
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `pathOrOptions` | `string \| Object` | Custom path or options object. |

## Examples

```js
// Default endpoint at /health
app.healthCheck();

// Custom path
app.healthCheck("/status");

// With readiness probe
app.healthCheck({
  readinessCheck: async () => {
    const ok = await db.ping();
    return { ok };
  }
});
```

## Response

**200 OK:**

```json
{
  "status": "OK",
  "uptime": 123.456,
  "pid": 12345,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**503 Service Unavailable** if readiness check fails.
