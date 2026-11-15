---
title: "Observability"
description: Built-in features for monitoring and tracing requests.
sidebar:
  order: 4
---

Kaelum provides built-in middleware for common observability needs, making it easier to trace requests across microservices and measure performance metrics without adding external dependencies.

## Request ID

The Request ID middleware automatically attaches a unique `X-Request-Id` header (using standard UUID v4) to every incoming request and outgoing response.

This is essential for:
- Tracing a single request's lifecycle across multiple services
- Correlating log entries (by logging `req.id`)
- Error tracking

```js
const kaelum = require('kaelum');
const app = kaelum();

// Enable request IDs for all requests
app.requestId();

app.get('/', (req, res) => {
  console.log(`Processing request: ${req.id}`);
  res.send('Hello World');
});
```

If an upstream proxy, load balancer, or API Gateway already provides an `X-Request-Id` header, Kaelum automatically detects and preserves it, ensuring continuous distributed tracing.

See [`app.requestId()` API Reference](/kaelum/api-reference/request-id/) for options like custom header names or generators.

## Server Timing

The Timing middleware injects a `Server-Timing` header into the response, following the official [W3C Server-Timing Specification](https://www.w3.org/TR/server-timing/).

This header records the exact total processing duration of the request in milliseconds and allows browsers' developer tools (Network tab) to display backend timing metrics natively.

```js
// Enable server timing metrics
app.timing();
```

The header format looks like:
```http
Server-Timing: total;dur=12.34
```

See [`app.timing()` API Reference](/kaelum/api-reference/timing/) for configuration options.
