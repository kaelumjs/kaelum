---
title: "redirect()"
description: Register URL redirections.
sidebar:
  order: 6
---

## Signature

```js
app.redirect(from, to, [status])
app.redirect(map)
app.redirect(entries)
```

## Parameters

### Three-argument form

| Name | Type | Description |
|---|---|---|
| `from` | `string` | Source path (e.g., `'/old'`). |
| `to` | `string` | Target URL or path. |
| `status` | `number` | HTTP status code (default: `302`). |

### Map form

| Name | Type | Description |
|---|---|---|
| `map` | `Object` | `{ from: to }` pairs. All use status `302`. |

### Array form

| Name | Type | Description |
|---|---|---|
| `entries` | `Array` | Array of `{ from, to, status? }` objects. |

**Returns:** `Array` of registered entries `[{ path, to, status }]` or `null`.

## Examples

```js
// Single redirect
app.redirect("/old", "/new");

// Permanent redirect
app.redirect("/legacy", "/modern", 301);

// Map syntax
app.redirect({
  "/old-page": "/new-page",
  "/deprecated": "/current",
});

// Array syntax with per-entry status
app.redirect([
  { from: "/a", to: "/b" },
  { from: "/c", to: "/d", status: 301 },
]);
```

:::note
Re-registering a redirect for the same path safely replaces the previous Kaelum handler.
:::
