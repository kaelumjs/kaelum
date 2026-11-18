---
title: Routing
description: Route trees, nested paths, per-level middleware, resources and single-route shortcuts.
sidebar:
  order: 1
---

Routes are declared as a tree: an object whose keys are HTTP methods, sub-paths or `use`.

```ts
app.route("/users", {
  get: () => db.users.all(),                     // GET  /users
  post: (c) => c.created(db.users.create(c.body)), // POST /users

  "/:id": {
    use: [auth],                                 // runs for /users/:id and below
    get: (c) => db.users.find(c.params.id),      // GET    /users/:id
    delete: (c) => c.noContent(),                // DELETE /users/:id

    "/posts": {
      get: (c) => db.posts.byUser(c.params.id),  // GET /users/:id/posts
    },
  },
});
```

## Keys of a tree

| Key | Meaning |
| --- | --- |
| `get`, `post`, `put`, `patch`, `delete`, `head`, `options` | an endpoint: a handler function or an [endpoint object](#endpoint-objects) |
| a string starting with `/` | a nested tree; its path is appended to the parent's |
| `use` | an array of middleware for this level and every level below it |

Any other key is an error when the route is registered, and a type error in TypeScript. The whole tree is checked before anything is registered, so a mistake deep in it never leaves half of the routes in place.

## Path params

Params come from every level of the path, and in TypeScript `c.params` is typed from it:

```ts
app.route("/orgs/:orgId", {
  "/users/:userId": {
    get: (c) => {
      c.params; // { orgId: string; userId: string }
    },
  },
});
```

Params are always strings. To get numbers, give the endpoint a `params` schema that coerces them (see [Validation](/guide/validation/)).

## Endpoint objects

Write an endpoint as an object when it needs schemas or its own middleware:

```ts
app.route("/users", {
  post: {
    use: [requireAdmin],     // after the tree's `use`, only for this endpoint
    body: NewUser,           // validates and types c.body
    query: Paging,           // validates and types c.query
    params: UserParams,      // validates and types c.params
    handler: (c) => c.created(db.users.create(c.body)),
  },
});
```

Order for each request: the tree's `use` from the outermost level inward, then the endpoint's `use`, then validation (params, query, body), then the handler. Authentication in `use` can therefore reject a request before its body is inspected.

## Route trees in their own files

`defineRoutes` declares a tree away from the app. The full path is given up front, so `c.params` is typed inside the file:

```ts title="src/routes/users.ts"
import { defineRoutes } from "kaelum";

export const userRoutes = defineRoutes("/orgs/:orgId/users")({
  get: (c) => db.users.list(c.params.orgId),
});
```

```ts title="src/app.ts"
app.route(userRoutes);
```

## Resources

`app.resource` registers CRUD routes by convention. Only the actions you give are registered:

```ts
app.resource("/posts", {
  list: () => db.posts.all(),                             // GET    /posts
  create: { body: NewPost, handler: (c) => c.created() }, // POST   /posts
  get: (c) => db.posts.find(c.params.id),                 // GET    /posts/:id
  update: (c) => db.posts.patch(c.params.id, c.body),     // PATCH  /posts/:id
  replace: (c) => db.posts.put(c.params.id, c.body),      // PUT    /posts/:id
  remove: (c) => c.noContent(),                           // DELETE /posts/:id
  use: [auth],                                            // for all of them
});
```

Each action takes a handler or an endpoint object, exactly like a tree.

## Single routes

For one route, use the method shortcuts:

```ts
app.get("/ping", () => "pong");
app.post("/login", { use: [rateLimit({ max: 5 })], body: Credentials, handler: login });
app.delete("/sessions/:id", (c) => c.noContent());
```

Available: `app.get`, `app.post`, `app.put`, `app.patch`, `app.delete`.

All three styles share one route table: registering the same method and path twice throws, whichever style was used.

## What Kaelum answers for you

- **404** for paths with no route, in the standard error format.
- **405** when the path exists but the method does not, with an `Allow` header listing the methods.
- **HEAD** is answered by the `GET` endpoint when there is no `HEAD` one.
- **OPTIONS** answers `204` with the `Allow` header when there is no `OPTIONS` endpoint.

`app.routes()` lists every registered endpoint:

```ts
app.routes(); // [{ method: "GET", path: "/users" }, { method: "POST", path: "/users" }, ...]
```

:::note[Known limitation]
A sub-path whose value is a handler instead of a tree, as in `{ "/:id": (c) => ... }`, type-checks but throws when the route is registered. Write `{ "/:id": { get: (c) => ... } }`.
:::
