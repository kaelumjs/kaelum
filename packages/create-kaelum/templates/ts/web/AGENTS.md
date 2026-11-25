# AGENTS.md

A Kaelum web app in TypeScript. Kaelum is Express 5 with production defaults: security headers, a body size limit, request IDs, request logs, `GET /health`, graceful shutdown and one JSON error format are already on.

Kaelum docs, written for agents: https://kaelumjs.matthcodes.dev/llms.txt (every page is also available as Markdown by adding `.md` to its URL).

## Commands

- `npm run dev`: start with file watching (Node runs the .ts files directly)
- `npm run typecheck`: type-check
- `npm run build`: compile to `dist/`
- `npm start`: run the compiled app

Environment variables go in `.env` (and `.env.<NODE_ENV>`), loaded when the app imports kaelum. Variables already set in the environment win.

## Layout

- `src/app.ts`: creates the app with its options, registers the routes and starts it
- `src/routes/`: one file per area; each exports a function that receives the app and calls `app.route`
- `src/middlewares/`: Express middleware
- `views/`: EJS templates rendered with `c.render()`; shared parts in `views/partials/`
- `public/`: static files, served by the `static` option; `public/index.html` is the home page

## Writing routes

```ts
import type { Kaelum } from "kaelum";

export default function blogRoutes(app: Kaelum) {
  app.route("/blog", {
    get: async (c) => c.render("blog/index", { title: "Blog", posts: await db.posts.all() }),

    "/:slug": {
      get: async (c) => {
        const post = await db.posts.find(c.params.slug);
        return post ? c.render("blog/post", { title: post.title, post }) : c.notFound();
      },
    },
  });
}
```

Call it from `src/app.ts`: `blogRoutes(app)`. Views start with `<%- include("partials/header") %>` and end with `<%- include("partials/footer") %>`, and receive `title`.

## Rules

- Handlers take one argument, `c`. Return the data, or use `c.created()`, `c.noContent()`, `c.render()`, `c.redirect()`. Do not use `res.json()` / `res.send()`.
- Validate input with `body`, `query` or `params` schemas on the endpoint (`k` from kaelum, or Zod/Valibot). Query strings and params are strings: use `k.coerce.number()` for numbers.
- For errors, throw `HttpError(status, message)` or return `c.notFound()`, `c.badRequest()`, ... Never send error bodies by hand.
- Middleware is plain Express `(req, res, next)`. Pass data to handlers on `res.locals` and read it with `c.res.raw.locals`.
- Configuration goes in the `kaelum({ ... })` options in `src/app.ts`. Do not add helmet, cors, body-parser, morgan, serve-static or a request-id package: Kaelum has them. Turn CORS, rate limiting or CSRF on with `security: { ... }`.
- Log with `c.log.info(message, data)` in handlers (it carries the request ID), not `console.log`.
- Clean up resources (database, queues) in `app.onClose(() => ...)`.
- In views, `<%= value %>` escapes HTML and `<%- value %>` does not: use `<%-` only for `include`.
- Values middleware put on `res.locals` (like `user`) are available in every view.
- Relative imports keep the `.ts` extension: `import users from "./routes/users.ts"`.
- Only erasable TypeScript: no `enum`, `namespace` or constructor parameter properties. Node strips the types and runs the file as is.
- Do not annotate `c` in handlers. Its type, including `c.params`, `c.body` and `c.query`, is inferred from the path and the schemas.
- Run `npm run typecheck` after changes.

## Testing

To add tests, use `testApp` from `kaelum/testing` with any test runner. It loads `src/app.ts` without opening a port:

```ts
import { testApp } from "kaelum/testing";

const client = await testApp(() => import("../src/app.ts"));
const res = await client.get("/health");
```
