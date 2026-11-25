---
title: Security
description: Security headers, CORS, rate limiting, CSRF and IP restriction.
sidebar:
  order: 9
---

Security headers and a body size limit are on from the start. The rest is one option away, and every rejection answers in the [standard error format](/guide/errors/).

## Security headers

[Helmet](https://helmetjs.github.io/) sets headers such as `Content-Security-Policy`, `Strict-Transport-Security` and `X-Content-Type-Options` on every response. Configure or turn it off:

```ts
kaelum({ security: { helmet: { contentSecurityPolicy: false } } });
```

## CORS

Off by default: cross-origin access is something to allow on purpose.

```ts
kaelum({ security: { cors: { origin: ["https://app.example"], credentials: true } } });
```

`cors: true` allows any origin. Options: `origin`, `methods`, `allowedHeaders`, `exposedHeaders`, `credentials`, `maxAge`.

## Rate limiting

```ts
kaelum({ security: { rateLimit: { max: 300, windowMs: 60_000 } } });
```

`rateLimit: true` allows 100 requests per 15 minutes per IP. Over the limit, the answer is `429` with `TOO_MANY_REQUESTS` and a `Retry-After` header. Responses carry `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`.

For a single route, such as a login, use the factory:

```ts
import { rateLimit } from "kaelum";

app.post("/login", { use: [rateLimit({ max: 5, windowMs: 60_000 })], handler: login });
```

| Option | Default |
| --- | --- |
| `max` | `100` per window and client |
| `windowMs` | 15 minutes |
| `keyGenerator` | `req.ip` |
| `skip` | none: a function returning `true` skips the request |
| `headers` | `true` |
| `statusCode`, `message` | `429` and the standard error body |
| `store` | in memory, per process |

:::caution
Behind a proxy, set [`trustProxy`](/guide/configuration/#trust-proxy). Otherwise every client shares the proxy's IP and one client can exhaust the limit for all. With several processes or servers, the in-memory store counts per process; pass a shared `store` (for example backed by Redis) to count globally.
:::

## CSRF

For apps that use cookies for authentication. Two strategies:

**Origin check** (`strategy: "origin"`, the default) rejects `POST`, `PUT`, `PATCH` and `DELETE` requests whose `Origin` or `Referer` is not allowed. It needs nothing from the client:

```ts
kaelum({ security: { csrf: { origin: "https://app.example" } } });
```

Without `origin`, the request's own host is the only allowed origin.

**Double-submit token** (`strategy: "token"`) sets a `csrf-token` cookie, and the client must echo it in the `X-CSRF-Token` header:

```ts
kaelum({ security: { csrf: { strategy: "token" } } });
```

```js
// in the browser
fetch("/items", {
  method: "POST",
  headers: { "X-CSRF-Token": readCookie("csrf-token") },
});
```

Exclude paths that are called by other servers, such as webhooks:

```ts
kaelum({ security: { csrf: { exclude: ["/webhooks/*"] } } });
```

Failures answer `403` with `CSRF_FAILED`.

## IP restriction

```ts
kaelum({
  security: {
    ipRestriction: { allow: ["10.0.0.0/8"], deny: ["0.0.0.0/0"] },
  },
});
```

`allow` always wins over `deny`. A request matching neither passes. Rules are IPv4 addresses or CIDR ranges. Denied requests get `403` with `IP_NOT_ALLOWED`, or your own `onDenied(req, res)`.

To protect only part of the app:

```ts
import { ipRestriction } from "kaelum";

app.route("/admin", {
  use: [ipRestriction({ allow: ["192.168.0.0/16"], deny: ["0.0.0.0/0"] })],
  get: dashboard,
});
```

## Body size

Bodies over 100 kb are rejected with `413` before they are read. Adjust with [`body.limit`](/guide/configuration/#body).

## Errors do not leak

Unexpected errors answer a generic `500`. The real error goes to the logs, never to the client. See [Errors](/guide/errors/#unexpected-errors).
