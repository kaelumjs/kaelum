---
title: "apiRoute()"
description: Create RESTful API resources quickly.
sidebar:
  order: 3
---

## Signature

```js
app.apiRoute(resource, handlers)
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `resource` | `string` | Resource name (e.g., `'users'`). |
| `handlers` | `Object \| Boolean` | Handler map or `true` for stubs. |

## Patterns

### Manual CRUD

```js
app.apiRoute("users", {
  get: listUsers,
  post: createUser,
  "/:id": {
    get: getUser,
    put: updateUser,
    delete: deleteUser
  }
});
```

### Auto Stubs

```js
app.apiRoute("todos", true);
// Creates 501 stubs for GET/POST /todos, GET/PUT/DELETE /todos/:id
```

### CRUD Shorthand

```js
app.apiRoute("users", {
  crud: {
    list: (req, res) => res.json([]),
    create: (req, res) => res.status(201).send(),
    show: (req, res) => res.json({ id: req.params.id }),
    update: (req, res) => res.json({ updated: true }),
    remove: (req, res) => res.status(204).send()
  }
});
```

## Path Normalization

- `'users'` → `'/users'`
- `'/api/v1/posts'` → stays the same

`apiRoute` internally calls `addRoute`, so middleware chains and nested paths work.
