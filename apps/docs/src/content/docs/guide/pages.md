---
title: Pages and views
description: Static files, server-rendered views, redirects, trailing slashes and custom 404 pages.
sidebar:
  order: 6
---

Everything a site needs is configured in `kaelum({ ... })`:

```ts title="src/app.ts"
import kaelum from "kaelum";

const app = kaelum({
  static: "public",
  views: true,
  trailingSlash: "redirect",
  redirects: { "/blog": "/articles" },
  notFound: (c) => c.render("404"),
});

app.get("/", (c) => c.render("home", { title: "Welcome" }));
```

## Static files

```ts
kaelum({ static: "public" });
kaelum({ static: { dir: "public", prefix: "/assets", maxAge: "1d", immutable: true } });
```

`public/index.html` is served at `/`, which makes it a natural home page; pages that need data or shared layout are better as views. The folder is relative to the project root, the folder the app is started from. Files are served before the routes; a missing file falls through to the routes and, at the end, the 404.

| Option | Default |
| --- | --- |
| `dir` | required |
| `prefix` | `/` |
| `maxAge` | `0`. Milliseconds or a string such as `"1d"` |
| `immutable` | `false` |
| `index` | `"index.html"`; `false` disables |
| `extensions` | none. `["html"]` serves `/about` from `about.html` |
| `dotfiles` | `"ignore"` |

## Views

Turn views on and render with `c.render()`:

```ts
const app = kaelum({ views: true });

app.get("/users/:id", async (c) => {
  const user = await db.users.find(c.params.id);
  return c.render("user", { user });
});
```

`views: true` uses [EJS](https://ejs.co) templates from the `views/` folder. Install the engine in the project:

```bash
npm install ejs
```

```ejs title="views/user.ejs"
<%- include("partials/header", { title: user.name }) %>
<h1><%= user.name %></h1>
<%- include("partials/footer") %>
```

- `<%= value %>` escapes HTML; `<%- value %>` does not, so use it only for trusted markup such as includes.
- Values that middleware put on `res.locals` are available in every view.
- `c.render(view, data?, status?)` sends `text/html`. Without a status it keeps the current one: 200 in a route, 404 in `notFound`.

Another engine works the same way, as long as it works with Express:

```ts
kaelum({ views: { engine: "pug", dir: "templates" } });
```

The engine is loaded from the project, so it must be in the project's dependencies. If it is missing, `kaelum()` fails right away with the install command.

## Trailing slashes

By default `/about/` and `/about` reach the same route. For one URL per page, which search engines prefer, redirect:

```ts
kaelum({ trailingSlash: "redirect" }); // GET /about/ → 301 /about, query string kept
```

Only `GET` and `HEAD` are redirected; other methods are not touched.

## Redirects

```ts
kaelum({
  redirects: {
    "/blog": "/articles",                              // 302
    "/old-pricing": { to: "/pricing", status: 301 },   // permanent
  },
});
```

Paths match exactly. For anything dynamic, use `c.redirect()` in a route.

## Custom 404 page

```ts
kaelum({ notFound: (c) => c.render("404") });
```

Whatever `notFound` returns is sent with status 404. Return nothing to keep the default JSON body, for example for API paths:

```ts
kaelum({
  notFound: (c) => (c.req.path.startsWith("/api") ? undefined : c.render("404")),
});
```

For error pages, see [`onError`](/guide/errors/#custom-error-responses).
