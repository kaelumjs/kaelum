---
title: "CSRF (API Reference)"
description: API reference for Kaelum's built-in CSRF protection middleware.
sidebar:
  order: 12
---

## setConfig({ csrf })

```js
app.setConfig({ csrf: true });
app.setConfig({ csrf: { origin: 'https://myapp.com', exclude: ['/webhooks'] } });
```

Activates the **origin check** middleware globally. All mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) must carry a matching `Origin` or `Referer` header.

| Parameter | Type | Description |
|-----------|------|-------------|
| `csrf` | `boolean \| CsrfOptions` | `true` = auto-detect host. Object = full options. `false` = disable. |

---

## app.useCsrf(options?)

```js
app.useCsrf(options?)
```

Activates the **double-submit cookie** middleware. Generates a `csrf-token` cookie on every request and validates that mutating requests echo it back via `X-CSRF-Token` header. Uses `crypto.timingSafeEqual` for constant-time comparison.

Returns `app` for chaining.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.cookie` | `string` | `'csrf-token'` | Cookie name |
| `options.header` | `string` | `'X-CSRF-Token'` | Request header name |
| `options.exclude` | `string[]` | `[]` | Paths excluded from validation |
| `options.methods` | `string[]` | `['POST','PUT','PATCH','DELETE']` | Methods to protect |
| `options.cookieOptions` | `object` | `{}` | Extra options passed to `res.cookie()` |

### Returns

`KaelumApp` — the app instance for chaining.

---

## CsrfOptions

```ts
interface CsrfOptions {
  origin?: string | string[];
  exclude?: string[];
  methods?: string[];
  cookie?: string;
  header?: string;
  cookieOptions?: object;
}
```

---

## Error Response

On CSRF validation failure, both modes respond with:

```
HTTP/1.1 403 Forbidden
Content-Type: application/json

{ "error": "CSRF validation failed" }
```

---

## Examples

```js
// Origin check only (API)
app.setConfig({ csrf: { origin: 'https://myapp.com' } });

// Double-submit only (HTML forms)
app.useCsrf();

// Custom cookie/header names
app.useCsrf({
  cookie: 'xsrf-token',
  header: 'X-XSRF-TOKEN',
});

// Exclude webhook endpoints
app.setConfig({
  csrf: {
    origin: 'https://myapp.com',
    exclude: ['/webhooks/*'],
  },
});

// Disable CSRF (after enabling via setConfig)
app.setConfig({ csrf: false });
```
