# AGENTS.md

A Kaelum REST API in TypeScript. Kaelum is Express 5 with production defaults: security headers, a body size limit, request IDs, request logs, `GET /health`, graceful shutdown and one JSON error format are already on.

Kaelum docs, written for agents: https://kaelumjs.matthcodes.dev/llms.txt (every page is also available as Markdown by adding `.md` to its URL).

## Commands

- `npm run dev`: start with file watching (Node runs the .ts files directly)
- `npm test`: run the tests (`node --test`)
- `npm run typecheck`: type-check without building
- `npm run build`: compile to `dist/`
- `npm start`: run the compiled app

## Layout

- `src/app.ts`: `createApp()` builds the app (options, routes) without starting it
- `src/server.ts`: starts the app; nothing else
- `src/routes/`: one route tree per area, made with `defineRoutes`
- `src/middlewares/`: Express middleware
- `src/app.test.ts`: tests

## Writing routes

```ts
import { defineRoutes, HttpError, k } from "kaelum";

export const projectRoutes = defineRoutes("/projects")({
  get: () => db.projects.all(),                  // a returned value is sent as JSON

  post: {
    body: k.object({ name: k.string().min(1) }), // validated before the handler runs
    handler: (c) => c.created(db.projects.create(c.body)),
  },

  "/:id": {
    use: [requireUser],                          // middleware for this level and below
    get: async (c) => {
      const project = await db.projects.find(c.params.id);
      if (!project) throw new HttpError(404, "Project not found");
      return project;
    },
  },
});
```

Register it in `src/app.ts` with `app.route(projectRoutes)`. For CRUD, `app.resource(path, { list, create, get, update, replace, remove })` is shorter; for one route, `app.get(path, handler)` and friends.

## Rules

- Handlers take one argument, `c`. Return the data, or use `c.created()`, `c.noContent()`, `c.html()`, `c.redirect()`. Do not use `res.json()` / `res.send()`.
- Validate input with `body`, `query` or `params` schemas on the endpoint (`k` from kaelum, or Zod/Valibot). Query strings and params are strings: use `k.coerce.number()` for numbers.
- For errors, throw `HttpError(status, message)` or return `c.notFound()`, `c.badRequest()`, ... Never send error bodies by hand: responses must keep the `{ error: { code, message } }` shape.
- Middleware is plain Express `(req, res, next)`. Pass data to handlers on `res.locals` and read it with `c.res.raw.locals`.
- Configuration goes in the `kaelum({ ... })` options in `src/app.ts`. Do not add helmet, cors, body-parser, morgan or a request-id package: Kaelum has them. Turn CORS, rate limiting or CSRF on with `security: { ... }`.
- Log with `c.log.info(message, data)` in handlers (it carries the request ID), not `console.log`.
- Clean up resources (database, queues) in `app.onClose(() => ...)`.
- Every new route gets a test in `src/app.test.ts` using `testApp` from `kaelum/testing`.
- Relative imports keep the `.ts` extension: `import { x } from "./routes/users.ts"`.
- Only erasable TypeScript: no `enum`, `namespace` or constructor parameter properties. Node strips the types and runs the file as is.
- Do not annotate `c` in handlers. Its type, including `c.params`, `c.body` and `c.query`, is inferred from the path and the schemas.
- Run `npm run typecheck` after changes.
