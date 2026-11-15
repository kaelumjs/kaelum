---
title: "testApp()"
description: Create a clean HTTP test client for your Kaelum app without starting a server.
sidebar:
  order: 11
---

## Import

```js
const { testApp } = require('kaelum/test');
```

> **Prerequisite:** `supertest` must be installed in your project:
> ```bash
> npm install supertest --save-dev
> ```
> If `supertest` is not found, `kaelum/test` will throw a clear error with the install command.

## Signature

```js
testApp(app)
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `app` | `KaelumApp` | A Kaelum (or Express) app instance. No server needs to be started. |

## Returns

A `TestClient` object with the following methods:

| Method | Description |
|--------|-------------|
| `get(path, options?)` | HTTP GET |
| `post(path, options?)` | HTTP POST |
| `put(path, options?)` | HTTP PUT |
| `patch(path, options?)` | HTTP PATCH |
| `delete(path, options?)` | HTTP DELETE |
| `head(path, options?)` | HTTP HEAD |

All methods return a Promise that resolves to the HTTP response (supertest response object with `status`, `body`, `headers`, `text`, etc.).

## Options

All methods accept an optional second argument:

| Option | Type | Description |
|--------|------|-------------|
| `body` | `any` | Request body — auto-serialised as JSON, sets `Content-Type: application/json` automatically |
| `headers` | `Record<string, string>` | Additional request headers |
| `query` | `Record<string, any>` | Query params appended to the path |
| `auth.bearer` | `string` | Sets `Authorization: Bearer <token>` |
| `auth.basic` | `string` | Sets `Authorization: Basic <base64(user:pass)>` |

## Examples

```js
const { testApp } = require('kaelum/test');
const app = require('./app');

const client = testApp(app);

// GET
const res = await client.get('/users');

// POST with JSON body
const res = await client.post('/users', {
  body: { name: 'Alice', email: 'alice@example.com' },
});

// With query params
const res = await client.get('/items', {
  query: { page: 1, limit: 20 },
});

// With Bearer auth
const res = await client.get('/admin', {
  auth: { bearer: 'my-token' },
});

// With Basic auth
const res = await client.get('/protected', {
  auth: { basic: 'user:password' },
});

// Combining options
const res = await client.put('/posts/1', {
  body: { title: 'Updated' },
  headers: { 'X-Request-Id': 'abc-123' },
  auth: { bearer: token },
});
```
