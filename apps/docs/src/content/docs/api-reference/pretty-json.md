---
title: "prettyJson / usePrettyJson"
description: API reference for Kaelum's Pretty JSON middleware.
sidebar:
  order: 10
---

## `app.usePrettyJson(mode?)`

Installs middleware that formats JSON responses with 2-space indentation.

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | `boolean \| 'query' \| 'always'` | `true` | `true`/`'always'` = always pretty-print. `'query'` = only when `?pretty` is in the URL. |

### Returns

`KaelumApp` — the app instance (chainable).

### Example

```js
// Always pretty-print
app.usePrettyJson();

// Only when ?pretty is present
app.usePrettyJson("query");
```

---

## `setConfig({ prettyJson })`

| Value | Behaviour |
|-------|-----------|
| `true` | Always pretty-prints (equivalent to `usePrettyJson()`) |
| `'query'` | Only formats when `?pretty` querystring is present |
| `false` | Disables Kaelum-managed pretty JSON |

```js
app.setConfig({ prettyJson: "query" });
```
