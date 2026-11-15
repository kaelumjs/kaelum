---
title: "ETag (API Reference)"
description: API reference for Kaelum's built-in ETag middleware.
sidebar:
  order: 13
---

## setConfig({ etag })

```js
app.setConfig({ etag: true });
app.setConfig({ etag: { weak: true, exclude: ['/stream/*'] } });
```

Configures ETag generation globally. When activated, responses include an `ETag` header representing the body contents, and the server automatically processes `If-None-Match` headers to return `304 Not Modified`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `etag` | `boolean \| EtagOptions` | `true` = strong ETags. Object = full options. `false` = disable. |

---

## app.useEtag(options?)

```js
app.useEtag(options?)
```

Alternative to `setConfig`, enables ETags and returns the app instance for chaining.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.weak` | `boolean` | `false` | If true, generates weak ETags (`W/"..."`) |
| `options.exclude` | `string[]` | `[]` | Paths that should **not** receive ETags |

### Returns

`KaelumApp` — the app instance for chaining.

---

## EtagOptions

```ts
interface EtagOptions {
  weak?: boolean;
  exclude?: string[];
}
```

---

## Behavior Details

- **Dependencies:** Uses Express's native ETag engine and Node's native `crypto.createHash('sha1')`. No external packages required.
- **Weak vs Strong:** Strong ETags indicate byte-for-byte equivalence. Weak ETags (prefixed with `W/`) indicate semantic equivalence.
- **Excluded Paths:** Paths matching strings or wildcards (`/*`) in the `exclude` array will have their `ETag` header stripped before the response is finalized. Useful for streams or Server-Sent Events.

---

## Examples

```js
// Strong ETags (default)
app.setConfig({ etag: true });

// Weak ETags
app.useEtag({ weak: true });

// Exclude specific paths
app.setConfig({
  etag: {
    exclude: [
      '/sse',         // Exact match
      '/webhooks/*',  // Wildcard match
    ],
  },
});
```
