---
title: Recipes
description: Short, complete solutions to common tasks, such as authentication, pagination, a readiness check and a single-page app backend.
sidebar:
  order: 14
---

Each recipe uses only Kaelum and the Node standard library, unless it says otherwise.

## Authentication with a bearer token

Check the token in a middleware, keep the user on `res.locals`, and protect a whole subtree with `use`:

```ts title="src/middlewares/auth.ts"
import type { Middleware } from "kaelum";

export const requireUser: Middleware = async (req, res, next) => {
  const token = req.get("authorization")?.replace(/^Bearer /, "");
  const user = token ? await sessions.verify(token) : undefined;

  if (!user) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Sign in first" } });
    return;
  }

  res.locals.user = user;
  next();
};
```

```ts title="src/routes/account.ts"
import type { Kaelum } from "kaelum";
import { requireUser } from "../middlewares/auth.ts";

export default function accountRoutes(app: Kaelum) {
  app.route("/account", {
    use: [requireUser],
    get: (c) => c.res.raw.locals.user,
    "/sessions": {
      delete: async (c) => {
        await sessions.revokeAll(c.res.raw.locals.user.id);
        return c.noContent();
      },
    },
  });
}
```

## Pagination

Validate and coerce the query string once, and get numbers in the handler:

```ts
import { k } from "kaelum";

const Page = k.object({
  page: k.coerce.number().int().min(1).default(1),
  size: k.coerce.number().int().min(1).max(100).default(20),
});

app.get("/posts", {
  query: Page,
  handler: async (c) => {
    const { page, size } = c.query; // numbers, with defaults applied
    const [items, total] = await db.posts.page((page - 1) * size, size);
    return { items, page, size, total };
  },
});
```

`GET /posts?size=500` answers `400` with `Must be at most 100`.

## Not found from a service

Throw `HttpError` where the problem is found. The handler stays one line:

```ts
import { HttpError } from "kaelum";

export async function getProject(id: string) {
  const project = await db.projects.find(id);
  if (!project) throw new HttpError(404, "Project not found", { details: { id } });
  return project;
}

app.get("/projects/:id", (c) => getProject(c.params.id));
```

## Readiness check and clean shutdown

Report the database in the health check and close it when the process stops:

```ts
const app = kaelum({
  health: { check: () => db.ping() },
});

app.onClose(() => db.close());
```

`GET /health` answers `503` while the database is unreachable, so the load balancer stops sending traffic. On `SIGTERM`, open requests finish before `db.close()` runs.

## Backend for a single-page app

Serve the built front end and an API under `/api`, with cookies protected against CSRF:

```ts
import { readFile } from "node:fs/promises";
import kaelum, { serveStatic } from "kaelum";

const app = kaelum({
  security: { csrf: { origin: "https://app.example" } },
  trustProxy: true,
});

app.route("/api/todos", {
  get: () => db.todos.all(),
  post: { body: NewTodo, handler: (c) => c.created(db.todos.create(c.body)) },
});

app.use(serveStatic("dist", { maxAge: "1y", immutable: true, index: false }));

// Any other GET falls back to the app shell, for client-side routing.
const shell = await readFile("dist/index.html", "utf8");
app.get("/*path", (c) => c.html(shell));
```

`/*path` is Express 5's syntax for "any path". Register it last so it does not shadow the API routes. Since the fallback only has `GET`, other methods on unknown paths answer `405` instead of `404`.

## Rate limit a login

Limit attempts per client on the routes that need it, not the whole app:

```ts
import { rateLimit } from "kaelum";

app.post("/login", {
  use: [rateLimit({ max: 5, windowMs: 15 * 60_000 })],
  body: Credentials,
  handler: login,
});
```

Behind a proxy, set `trustProxy` so each client is counted by its own address.
