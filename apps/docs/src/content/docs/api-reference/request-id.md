---
title: "requestId()"
description: Add X-Request-Id header to every request.
sidebar:
  order: 6
---

## Signature

```js
app.requestId([options])
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `options` | `Object` | Optional configuration object. |
| `options.headerName` | `string` | Custom header name (default: `'X-Request-Id'`). |
| `options.generator` | `Function` | Custom ID generator function (default: `crypto.randomUUID()`). |

## Usage

This middleware automatically injects a unique ID into every incoming request and outgoing response. If an upstream service (like a proxy or API gateway) already provides the header, Kaelum preserves the existing ID to maintain distributed tracing continuity.

The ID is exposed as `req.id` on the Request object for easy access in your route handlers or logging utilities.

## Examples

```js
// Default usage
app.requestId();

// Access the ID inside a handler
app.get('/api/users', (req, res) => {
  logger.info(`Fetching users. Request ID: ${req.id}`);
  res.json({ users: [] });
});

// Custom header name and custom ID format
app.requestId({
  headerName: "X-Trace-Id",
  generator: () => `trace_${Date.now()}_${Math.random()}`
});
```
