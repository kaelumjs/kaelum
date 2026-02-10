<div align="center">

<h1>Kaelum</h1>

[![npm version](https://img.shields.io/npm/v/kaelum)](https://www.npmjs.com/package/kaelum)
[![Build Status](https://github.com/MatheusCampagnolo/kaelum/actions/workflows/deploy-docs.yml/badge.svg)](https://github.com/MatheusCampagnolo/kaelum/actions)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-online-blue)](https://matheuscampagnolo.github.io/kaelum/)

**Kaelum.js** — Minimalist Node.js framework to simplify creation of web pages and REST APIs.  
Designed for students and developers who want a fast, opinionated project scaffold and a small, friendly API that encapsulates common Express.js boilerplate.

👉 [**Read the full documentation here**](https://matheuscampagnolo.github.io/kaelum/)

**If Kaelum helps you, consider supporting its development:**

<a href='https://ko-fi.com/Z8Z51NK4KT' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

</div>

## 🚀 Quick start

Create a new project (interactive):

```bash
npx kaelum create
```

Or create non-interactively (project name + template):

```bash
npx kaelum create my-app --template web
# or
npx kaelum create my-api --template api
```

Then:

```bash
cd my-app
npm install
npm start
```

> No need to install Kaelum globally — `npx` handles execution.

---

## 📦 What Kaelum provides

- CLI that scaffolds a ready-to-run project (Web or API template) using an opinionated **MVC** structure.
- Thin abstraction layer over **Express.js** that:

  - automates JSON / URL-encoded parsing by default,
  - automatically loads environment variables from `.env`,
  - automatically configures common security middlewares via `setConfig` (CORS, Helmet),
  - simplifies view engine setup via `setConfig`,
  - exposes a small, easy-to-learn API for routes, middleware and configuration.

- Small set of helpers for common tasks: `start`, `addRoute`, `apiRoute`, `setConfig`, `static`, `redirect`, `healthCheck`, `useErrorHandler`, and more.

Kaelum aims to reduce the initial setup burden while keeping flexibility for advanced users.

---

## 📁 Template structures

### Web template (`--template web`)

```
my-web-app/
├── public/          # Static files (CSS, JS)
│   └── style.css
├── views/           # HTML templates
│   └── index.html
├── controllers/     # Controller logic (MVC)
│   └── pagesController.js
├── middlewares/     # Custom middlewares
│   └── logger.js
├── routes.js        # Route definitions (example uses Kaelum helpers)
├── app.js           # Server initialization (uses Kaelum API)
└── package.json
```

### API template (`--template api`)

```
my-api-app/
├── controllers/
│   └── usersController.js
├── middlewares/
│   └── authMock.js
├── routes.js
├── app.js
└── package.json
```

---

## 🧩 Core API

> Kaelum exposes a factory — use `require('kaelum')` and call it to get an app instance:

```js
const kaelum = require("kaelum");
const app = kaelum();
```

### `app.setConfig(options)`

Enable/disable common features:

```js
app.setConfig({
  cors: true, // apply CORS (requires cors package in dependencies)
  helmet: true, // apply Helmet
  static: "public", // serve static files from "public"
  bodyParser: true, // default: enabled (JSON + urlencoded)
  logs: false, // enable request logging via morgan (if installed)
  port: 3000, // prefered port (used when calling app.start() without port)
  views: { engine: 'ejs', path: './views' } // configure view engine
});
```

- `setConfig` persists settings to the Kaelum config and will install/remove Kaelum-managed middlewares.
- Kaelum enables JSON/urlencoded parsing by default so beginners won't forget to parse request bodies.

---

### `app.start(port, callback)`

Starts the HTTP server. If `port` is omitted, Kaelum reads `port` from `setConfig` or falls back to `3000`.

```js
app.start(3000, () => console.log("Running"));
```

---

### `app.addRoute(path, handlers)` and `app.apiRoute(resource, handlers)`

Register routes easily:

```js
app.addRoute("/home", {
  get: (req, res) => res.send("Welcome!"),
  post: (req, res) => res.send("Posted!"),
});

// apiRoute builds RESTy resources with recursive nested subpaths:
app.apiRoute("users", {
  get: listUsers,
  post: createUser,
  "/:id": {
    get: getUserById,
    put: updateUser,
    delete: deleteUser,
    "/posts": {
      get: getUserPosts // GET /users/:id/posts
    }
  },
});
```

`addRoute` also accepts a single handler function (assumed `GET`).

---

### `app.setMiddleware(...)`

Flexible helper to register middleware(s):

```js
// single middleware
app.setMiddleware(require("helmet")());

// array of middlewares
app.setMiddleware([mw1, mw2]);

// mount middleware on a path
app.setMiddleware("/admin", authMiddleware);
```

---

### `app.redirect(from, to, status)`

Register a redirect route:

```js
app.redirect("/old-url", "/new-url", 302);
```

---

### `app.healthCheck(path = '/health')`

Adds a health endpoint returning `{ status: 'OK', uptime, timestamp, pid }`.

---

### `app.useErrorHandler(options)`

Attach Kaelum's default JSON error handler:

```js
app.useErrorHandler({ exposeStack: false });
```

It will return standardized JSON for errors and log server-side errors (5xx) to `console.error`.

---

## 🧪 Running Tests

Kaelum includes a unit test suite using **Jest**. To run the tests:

```bash
npm test
```

This checks core functionality including `setConfig`, routes, and error handlers.

---

## 🔧 Local development & contributing

```bash
git clone https://github.com/MatheusCampagnolo/kaelum.git
cd kaelum
npm install
npm link
```

Now you can test the CLI locally:

```bash
npx kaelum create my-test --template web
```

---

## 📝 Why Kaelum?

- Reduces repetitive boilerplate required to start Node/Express web projects.
- Opinionated scaffolding (MVC) helps beginners adopt better structure.
- Keeps a small API surface: easy to teach and document.
- Extensible — `setConfig` and middleware helpers allow adding features without exposing Express internals.

---

## ✅ Current status

> Kaelum is under active development.
> CLI scaffolds web and API templates, and the framework includes the MVP helpers (`start`, `addRoute`, `apiRoute`, `setConfig`, `static`, `redirect`, `healthCheck`, `useErrorHandler`) and security toggles for `cors` and `helmet`.

---

## 📚 Links

- [GitHub](https://github.com/MatheusCampagnolo/kaelum)
- [npm](https://www.npmjs.com/package/kaelum)
- [Documentation](https://matheuscampagnolo.github.io/kaelum/)

---

## 🧾 License

MIT — see [LICENSE](LICENSE).

---

## ✍️ Notes for maintainers

- Templates use `commonjs` (`require` / `module.exports`).
- Update template dependencies to reference the correct Kaelum version when releasing new npm versions.
