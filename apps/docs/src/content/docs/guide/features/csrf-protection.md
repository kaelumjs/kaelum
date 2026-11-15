---
title: "CSRF Protection"
description: Built-in CSRF protection middleware with origin checking and double-submit cookie modes.
sidebar:
  order: 9
---

Kaelum ships built-in CSRF (Cross-Site Request Forgery) protection with two complementary modes — **zero dependencies**, using only Node.js's native `crypto` module.

> [!NOTE]
> **Safe methods** (`GET`, `HEAD`, `OPTIONS`) are always exempt from CSRF checks per [RFC 7231](https://www.rfc-editor.org/rfc/rfc7231#section-4.2.1). Only mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`) are validated.

## Mode 1 — Origin Check (recommended for APIs)

Validates the `Origin` (or `Referer`) header against an allowlist. Zero-state, no cookies needed — perfect for JSON APIs.

### Via `setConfig`

```js
const kaelum = require('kaelum');
const app = kaelum();

// Use request host as the allowed origin automatically
app.setConfig({ csrf: true });

// Or specify allowed origins explicitly
app.setConfig({
  csrf: {
    origin: ['https://myapp.com', 'https://staging.myapp.com'],
    exclude: ['/api/webhooks'], // paths that skip CSRF checks
  },
});
```

### Behaviour

| Scenario | Result |
|----------|--------|
| `Origin` matches allowlist | ✅ Passes |
| `Origin` not present | ❌ 403 Forbidden |
| `Origin` not in allowlist | ❌ 403 Forbidden |
| `Referer` matches (no `Origin`) | ✅ Passes (fallback) |
| Path in `exclude` list | ✅ Skipped |

**Failure response:**
```json
{ "error": "CSRF validation failed" }
```

---

## Mode 2 — Double-Submit Cookie (for HTML form apps)

Generates a random token into a cookie on every request. On mutating requests, validates that the same token is echoed back via a custom request header. Uses `crypto.timingSafeEqual` for constant-time comparison.

### Via `app.useCsrf()`

```js
const app = kaelum();

app.useCsrf({
  cookie: 'csrf-token',       // default
  header: 'X-CSRF-Token',    // default
  exclude: ['/api/webhooks'],
});
```

### Frontend Integration

```js
// 1. On page load, read the cookie (it's set automatically by the first GET):
function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
}

// 2. Include the token in every mutating request:
await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCookie('csrf-token'),
  },
  body: JSON.stringify({ name: 'Alice' }),
});
```

### Behaviour

| Scenario | Result |
|----------|--------|
| GET / HEAD / OPTIONS | ✅ Cookie set, no validation |
| POST with matching cookie + header | ✅ Passes |
| POST without cookie | ❌ 403 Forbidden |
| POST with cookie but missing header | ❌ 403 Forbidden |
| POST with mismatched cookie and header | ❌ 403 Forbidden |

---

## Combining Both Modes

The two modes can coexist — origin check via `setConfig` runs globally, double-submit via `useCsrf()` can be scoped to specific route groups:

```js
// Global: block cross-origin requests to API
app.setConfig({
  csrf: { origin: 'https://myapp.com', exclude: ['/api/*'] },
});

// Scoped: double-submit for web form routes only
const web = app.group('/web');
web.useCsrf({ exclude: ['/web/health'] });
```

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `origin` | `string \| string[]` | Auto-detected from host | Allowed origin(s) for origin check mode |
| `exclude` | `string[]` | `[]` | Paths to skip. Use `'/prefix/*'` for wildcards |
| `methods` | `string[]` | `['POST','PUT','PATCH','DELETE']` | HTTP methods to protect |
| `cookie` | `string` | `'csrf-token'` | Cookie name (double-submit mode) |
| `header` | `string` | `'X-CSRF-Token'` | Header name (double-submit mode) |
| `cookieOptions` | `object` | `{}` | Extra options for `res.cookie()` |

See the [CSRF API Reference](/kaelum/api-reference/csrf/) for full details.
