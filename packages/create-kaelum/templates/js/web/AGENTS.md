# AGENTS.md

A Kaelum web app in JavaScript. Kaelum is Express 5 with production defaults: security headers, a body size limit, request IDs, request logs, `GET /health`, graceful shutdown and one JSON error format are already on.

Kaelum docs, written for agents: https://kaelumjs.matthcodes.dev/llms.txt (every page is also available as Markdown by adding `.md` to its URL).

## Commands

- `npm run dev`: start with file watching
- `npm start`: start the server

Environment variables go in `.env` (and `.env.<NODE_ENV>`), loaded when the app imports kaelum. Variables already set in the environment win.

## Layout

- `src/app.js`: creates the app with its options, registers the routes and starts it
- `src/routes/`: one file per area; each exports a function that receives the app and calls `app.route`
- `src/middlewares/`: Express middleware
- `views/`: EJS templates rendered with `c.render()`; shared parts in `views/partials/`
- `public/`: static files, served by the `static` option; `public/index.html` is the home page

## Writing routes

```js
export default function blogRoutes(app) {
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

Call it from `src/app.js`: `blogRoutes(app)`. Views start with `<%- include("partials/header") %>` and end with `<%- include("partials/footer") %>`, and receive `title`.

## Rules

- Handlers take one argument, `c`. Return the data, or use `c.created()`, `c.noContent()`, `c.render()`, `c.redirect()`. Do not use `res.json()` / `res.send()`.
- Validate input with `body`, `query` or `params` schemas on the endpoint (`k` from kaelum, or Zod/Valibot). Query strings and params are strings: use `k.coerce.number()` for numbers.
- For errors, throw `HttpError(status, message)` or return `c.notFound()`, `c.badRequest()`, ... Never send error bodies by hand.
- Middleware is plain Express `(req, res, next)`. Pass data to handlers on `res.locals` and read it with `c.res.raw.locals`.
- Configuration goes in the `kaelum({ ... })` options in `src/app.js`. Do not add helmet, cors, body-parser, morgan, serve-static or a request-id package: Kaelum has them. Turn CORS, rate limiting or CSRF on with `security: { ... }`.
- Log with `c.log.info(message, data)` in handlers (it carries the request ID), not `console.log`.
- Clean up resources (database, queues) in `app.onClose(() => ...)`.
- In views, `<%= value %>` escapes HTML and `<%- value %>` does not: use `<%-` only for `include`.
- Values middleware put on `res.locals` (like `user`) are available in every view.

## Testing

To add tests, use `testApp` from `kaelum/testing` with any test runner. It loads `src/app.js` without opening a port:

```js
import { testApp } from "kaelum/testing";

const client = await testApp(() => import("../src/app.js"));
const res = await client.get("/health");
```
