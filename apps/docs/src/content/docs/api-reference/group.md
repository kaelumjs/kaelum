---
title: "group()"
description: Create a URL-prefixed route group with optional shared middleware.
sidebar:
  order: 9
---

## Signature

```js
app.group(prefix, [...middleware])
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `prefix` | `string` | URL prefix for the group (e.g. `'/admin'`). A leading `/` is added automatically if missing. Trailing slashes are removed. |
| `...middleware` | `Function` | Zero or more middleware functions applied to every route registered in the group. |

## Returns

A `KaelumGroup` object with the following methods, all of which return the group itself for chaining:

| Method | Description |
|--------|-------------|
| `addRoute(path, handlers)` | Register routes (relative to group prefix) |
| `apiRoute(resource, handlers)` | Register RESTful routes |
| `redirect(from, to, [status])` | Register a redirect within the group |
| `healthCheck([pathOrOptions])` | Register a health endpoint within the group |
| `group(subPrefix, [...middleware])` | Create a nested sub-group |

The returned group also exposes `prefix` (string) and `router` (Express Router) as read-only properties.

## Examples

```js
// Basic group
const admin = app.group('/admin');
admin.addRoute('/users', { get: listUsers });

// With shared middleware
const api = app.group('/api/v1', authMiddleware, logMiddleware);
api.apiRoute('products', { get: listProducts });

// Nested groups
const v2 = app.group('/api/v2');
const internal = v2.group('/internal', requireInternal);
internal.addRoute('/metrics', { get: getMetrics });

// Chained
app.group('/public')
  .addRoute('/about', { get: aboutPage })
  .addRoute('/contact', { get: contactPage });
```
