---
title: "Testing Helpers"
description: A clean HTTP test client that wraps supertest for testing your Kaelum app.
sidebar:
  order: 8
---

Kaelum ships a `testApp()` helper that wraps [`supertest`](https://github.com/ladjs/supertest) with a cleaner, options-based API — so your test code reads naturally without boilerplate.

It is available as a **subpath import**:

```js
const { testApp } = require('kaelum/test');
```

> **Prerequisite:** Install `supertest` in your project:
> ```bash
> npm install supertest --save-dev
> ```

## Basic Usage

```js
const { testApp } = require('kaelum/test');
const app = require('./app'); // your Kaelum app

const client = testApp(app);

describe('Users API', () => {
  it('should list users', async () => {
    const res = await client.get('/users');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
  });

  it('should create a user', async () => {
    const res = await client.post('/users', {
      body: { name: 'Alice', email: 'alice@example.com' },
    });
    expect(res.status).toBe(201);
    expect(res.body.created).toBe(true);
  });
});
```

No server needs to be started — `testApp` uses supertest's in-process HTTP binding.

## Available Methods

All methods accept `(path, options?)` and return a Promise resolving to the HTTP response:

| Method | Description |
|--------|-------------|
| `client.get(path, options?)` | HTTP GET |
| `client.post(path, options?)` | HTTP POST |
| `client.put(path, options?)` | HTTP PUT |
| `client.patch(path, options?)` | HTTP PATCH |
| `client.delete(path, options?)` | HTTP DELETE |
| `client.head(path, options?)` | HTTP HEAD |

## Options

| Option | Type | Description |
|--------|------|-------------|
| `body` | `any` | Request body. Auto-serialised as JSON, sets `Content-Type: application/json` automatically |
| `headers` | `Object` | Additional request headers |
| `query` | `Object` | Query params appended to the path |
| `auth.bearer` | `string` | Sets `Authorization: Bearer <token>` |
| `auth.basic` | `string` | Sets `Authorization: Basic <base64(user:pass)>` |

## Examples

### Sending a body

```js
const res = await client.post('/posts', {
  body: { title: 'Hello World', content: 'My first post.' },
});
expect(res.status).toBe(201);
```

### Custom headers

```js
const res = await client.get('/data', {
  headers: {
    'X-API-Version': '2',
    'Accept-Language': 'pt-BR',
  },
});
```

### Query params

```js
const res = await client.get('/items', {
  query: { page: 1, limit: 20, sort: 'name' },
});
// requests: GET /items?page=1&limit=20&sort=name
```

### Bearer token auth

```js
const res = await client.get('/admin/users', {
  auth: { bearer: 'eyJhbGciOiJIUzI1NiJ9...' },
});
expect(res.status).toBe(200);
```

### Basic auth

```js
const res = await client.get('/protected', {
  auth: { basic: 'admin:secret' },
});
// Sets Authorization: Basic YWRtaW46c2VjcmV0
```

### Combining options

```js
const res = await client.post('/api/orders', {
  body: { productId: 'abc', qty: 2 },
  headers: { 'X-Idempotency-Key': 'req-001' },
  auth: { bearer: token },
});
```

See the [`testApp()` API Reference](/kaelum/api-reference/test-app/) for full details.
