---
title: "ETag"
description: Automatic ETag header generation and conditional request support (304 Not Modified).
sidebar:
  order: 10
---

Kaelum adds **ETag header** support to enable client-side caching and conditional requests. When the browser (or API client) already has a cached copy, the server returns `304 Not Modified` instead of re-sending the full body — reducing bandwidth and latency.

> [!NOTE]
> ETag support uses **Express's native ETag engine** under the hood, ensuring full compatibility with streams and edge cases. Zero additional dependencies.

## How ETags Work

```
1. Client:  GET /users
   Server:  200 OK  +  ETag: "d41d8cd98f"  +  body

2. Client:  GET /users  +  If-None-Match: "d41d8cd98f"
   Server:  304 Not Modified  (no body — saves bandwidth)

3. Body changes on server:
   Client:  GET /users  +  If-None-Match: "d41d8cd98f"
   Server:  200 OK  +  ETag: "a5f3e1bc72"  +  new body
```

## Usage

### Via `setConfig` (global)

```js
const kaelum = require('kaelum');
const app = kaelum();

// Strong ETags (default)
app.setConfig({ etag: true });

// Weak ETags
app.setConfig({ etag: { weak: true } });

// With excluded paths
app.setConfig({
  etag: {
    exclude: ['/stream/*', '/events'],
  },
});

// Disable
app.setConfig({ etag: false });
```

### Via `app.useEtag()` (standalone)

```js
app.useEtag();                        // strong ETags on all routes
app.useEtag({ weak: true });          // weak ETags
app.useEtag({ exclude: ['/stream/*'] }); // suppress on specific paths
```

`useEtag()` returns `app` for chaining.

---

## Strong vs Weak ETags

| Type | Format | When to use |
|------|--------|-------------|
| Strong (default) | `"a5f3e1bc72..."` | Byte-for-byte identical responses |
| Weak | `W/"a5f3e1bc72..."` | Semantically equivalent responses (e.g. minor whitespace differences) |

---

## Exclude Paths

Useful for streaming endpoints, Server-Sent Events, or any route where ETags don't make sense:

```js
app.setConfig({
  etag: {
    exclude: [
      '/stream/*',         // wildcard — matches /stream/events, /stream/logs, etc.
      '/health',           // exact match
    ],
  },
});
```

Excluded paths skip ETag generation entirely.

---

## Behaviour Summary

| Scenario | Result |
|----------|--------|
| GET with no `If-None-Match` | `200` + `ETag` header set |
| GET with matching `If-None-Match` | `304 Not Modified` (no body) |
| GET with stale `If-None-Match` | `200` + new `ETag` |
| POST, PUT, PATCH, DELETE | No ETag generated |
| Excluded path | No ETag header |
| `setConfig({ etag: false })` | ETags disabled globally |

See the [`useEtag()` API Reference](/kaelum/api-reference/etag/) for full details.
