---
title: "Route Groups"
description: Create URL-prefixed sub-routers with optional shared middleware.
sidebar:
  order: 6
---

Route Groups let you organize related routes under a shared URL prefix and optionally apply middleware to all of them at once — without affecting the rest of your application.

This keeps your routing code modular and avoids repetitive path prefixes.

## Basic Usage

```js
const kaelum = require('kaelum');
const app = kaelum();

// All routes inside this group are prefixed with /admin
const admin = app.group('/admin');

admin.addRoute('/users', {
  get: (req, res) => res.json({ users: [] }),
  post: (req, res) => res.status(201).json({ created: true }),
});

// Registers: GET /admin/users and POST /admin/users
app.start(3000);
```

## Shared Middleware

Pass middleware functions after the prefix to apply them to every route in the group. The middleware runs **before** any route handler, and is completely isolated from routes outside the group.

```js
function requireAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const api = app.group('/api/v1', requireAuth);

api.addRoute('/posts', { get: getPosts });
api.apiRoute('products', { get: listProducts, post: createProduct });

// requireAuth runs on all /api/v1/* routes, but nowhere else
```

## Using apiRoute Inside a Group

```js
const v1 = app.group('/api/v1');

v1.apiRoute('users', {
  get: listUsers,
  post: createUser,
  '/:id': {
    get: getUser,
    put: updateUser,
    delete: deleteUser,
  },
});

// Registers:
// GET    /api/v1/users
// POST   /api/v1/users
// GET    /api/v1/users/:id
// PUT    /api/v1/users/:id
// DELETE /api/v1/users/:id
```

## Chaining

All methods on a group return the group itself, enabling fluent chaining:

```js
app.group('/api')
  .addRoute('/ping', { get: (req, res) => res.json({ ok: true }) })
  .addRoute('/status', { get: (req, res) => res.json({ status: 'up' }) });
```

## Nested Groups

Groups can be nested inside other groups. Sub-group prefixes are relative to the parent:

```js
const api = app.group('/api');
const v2 = api.group('/v2'); // resolves to /api/v2

// Add middleware only to the admin sub-group
const admin = v2.group('/admin', requireAuth);
admin.addRoute('/dashboard', { get: showDashboard });

// Public routes — no auth middleware
const pub = v2.group('/public');
pub.addRoute('/docs', { get: showDocs });

// Registers:
// GET /api/v2/admin/dashboard  (with requireAuth)
// GET /api/v2/public/docs      (no auth)
```

## Health Checks and Redirects

Groups also support `healthCheck()` and `redirect()`:

```js
const internal = app.group('/internal');

// Health check scoped to /internal/health
internal.healthCheck('/health');

// Redirect scoped to /internal
internal.redirect('/old', '/new');
```

See the [`app.group()` API Reference](/kaelum/api-reference/group/) for full details.
