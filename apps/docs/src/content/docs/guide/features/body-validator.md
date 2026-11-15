---
title: "Body Validator"
description: Lightweight zero-dependency validation middleware for request body, query, and params.
sidebar:
  order: 7
---

Kaelum ships a lightweight, zero-dependency validation middleware for validating `body`, `query`, and `params` without requiring Zod, Joi, or any external library.

It is available as a **subpath import** so it only loads when you need it:

```js
const { validate } = require('kaelum/validate');
```

## Basic Usage

Pass `validate(schema)` as middleware in any route definition. If validation fails, it responds with `400` automatically — no extra error handling needed.

```js
const kaelum = require('kaelum');
const { validate } = require('kaelum/validate');

const app = kaelum();

app.addRoute('/users', {
  post: [
    validate({
      body: {
        name:  { type: 'string', required: true, min: 2, max: 50 },
        email: { type: 'string', required: true, pattern: 'email' },
        age:   { type: 'number', min: 0, max: 120 },
      },
    }),
    (req, res) => res.created({ message: 'User created' }),
  ],
});
```

**On validation failure (400):**
```json
{
  "error": "Validation failed",
  "fields": [
    { "field": "body.name", "message": "Required field missing" },
    { "field": "body.email", "message": "Must match pattern: email" }
  ]
}
```

All errors are collected before responding — you see every problem at once, not just the first one.

## Schema Structure

The schema object accepts three optional targets:

```js
validate({
  body:   { /* field rules */ },
  query:  { /* field rules */ },
  params: { /* field rules */ },
})
```

## Field Rules

Each field in the schema accepts the following rules:

| Rule | Type | Description |
|------|------|-------------|
| `type` | `string` | Expected type (see types below) |
| `required` | `boolean` | Field must be present and non-empty |
| `min` | `number` | Min length (string), min value (number), min items (array) |
| `max` | `number` | Max length (string), max value (number), max items (array) |
| `pattern` | `string \| RegExp` | Pattern preset name or a RegExp |
| `custom` | `Function` | Custom validator — return `true` to pass, or a string error message |

## Supported Types

| Type | Notes |
|------|-------|
| `string` | Standard string check |
| `number` | Standard number check. `query`/`params` strings are **coerced** automatically (e.g. `'42'` → `42`) |
| `boolean` | Standard boolean check. `query`/`params` `'true'`/`'false'` strings are coerced |
| `array` | Checks via `Array.isArray()` |
| `object` | Plain object, not an array |

## Pattern Presets

The `pattern` rule accepts built-in preset names or a custom `RegExp`:

```js
{ pattern: 'email' }        // user@example.com
{ pattern: 'url' }          // https://...
{ pattern: 'uuid' }         // 550e8400-e29b-41d4-a716-446655440000
{ pattern: 'alphanumeric' } // abc123 (no spaces or symbols)
{ pattern: /^KL-\d{4}$/ }  // custom RegExp
```

## Custom Validators

Use `custom` for arbitrary logic that built-in rules can't express:

```js
validate({
  body: {
    score: {
      type: 'number',
      custom: (value) => value % 2 === 0 || 'Score must be an even number',
    },
    password: {
      type: 'string',
      required: true,
      custom: (value) =>
        value === value.split('').reverse().join('') || 'Must not be a palindrome',
    },
  },
})
```

## Validating Query and Params

```js
app.get('/posts', [
  validate({
    query: {
      page:  { type: 'number', min: 1 },   // '?page=2' is coerced to 2
      limit: { type: 'number', max: 100 },
    },
  }),
  listPosts,
]);

app.get('/posts/:id', [
  validate({
    params: {
      id: { type: 'string', pattern: 'uuid' },
    },
  }),
  getPost,
]);
```

See the [`validate()` API Reference](/kaelum/api-reference/validate/) for full details.
