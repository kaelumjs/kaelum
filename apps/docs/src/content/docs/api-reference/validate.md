---
title: "validate()"
description: Middleware factory for validating request body, query, and params.
sidebar:
  order: 10
---

## Import

```js
const { validate } = require('kaelum/validate');
```

> This is a **subpath export** — it does not come from the main `kaelum` package. Import it explicitly only when needed.

## Signature

```js
validate(schema)
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `schema` | `Object` | Validation schema. Accepts `body`, `query`, and/or `params` keys. |
| `schema.body` | `Object` | Rules for `req.body` fields. |
| `schema.query` | `Object` | Rules for `req.query` fields. Values are coerced before validation. |
| `schema.params` | `Object` | Rules for `req.params` fields. Values are coerced before validation. |

## Field Rules

Each key in a target object is a field name. Its value is a rules object:

| Rule | Type | Description |
|------|------|-------------|
| `type` | `'string' \| 'number' \| 'boolean' \| 'array' \| 'object'` | Expected type |
| `required` | `boolean` | Field must be present and non-empty |
| `min` | `number` | String: min chars. Number: min value. Array: min items |
| `max` | `number` | String: max chars. Number: max value. Array: max items |
| `pattern` | `string \| RegExp` | Preset name or custom RegExp (strings only) |
| `custom` | `(value) => true \| string` | Custom function — return `true` to pass |

## Pattern Presets

| Preset | Validates |
|--------|-----------|
| `'email'` | `user@domain.tld` |
| `'url'` | `http(s)://...` |
| `'uuid'` | Standard UUID v4 |
| `'alphanumeric'` | Letters and digits only |

## Returns

An Express `RequestHandler` (middleware function).

- **On failure:** Responds `400` with `{ error: "Validation failed", fields: [...] }`. All field errors are collected before responding.
- **On success:** Calls `next()`.

## Examples

```js
// Basic usage
validate({
  body: {
    name:  { type: 'string', required: true, min: 2 },
    email: { type: 'string', required: true, pattern: 'email' },
  },
});

// Validate query params with type coercion
validate({
  query: {
    page:  { type: 'number', min: 1 },
    limit: { type: 'number', max: 100 },
  },
});

// Custom validator
validate({
  body: {
    score: {
      type: 'number',
      custom: (v) => v % 2 === 0 || 'Score must be even',
    },
  },
});
```
