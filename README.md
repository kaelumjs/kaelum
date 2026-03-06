<div align="center">

<img src=".github/logo.svg" alt="Kaelum" width="120" />

<h1>Kaelum</h1>

<p><strong>Fast, minimalist Node.js framework for web apps & REST APIs</strong></p>

[![npm version](https://img.shields.io/npm/v/kaelum?color=blue)](https://www.npmjs.com/package/kaelum)
[![npm downloads](https://img.shields.io/npm/dm/kaelum?color=green)](https://www.npmjs.com/package/kaelum)
[![CI](https://github.com/kaelumjs/kaelum/actions/workflows/test.yml/badge.svg)](https://github.com/kaelumjs/kaelum/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[📚 Documentation](https://kaelumjs.vercel.app) · [🐛 Report Bug](https://github.com/kaelumjs/kaelum/issues/new?template=bug_report.md) · [💡 Request Feature](https://github.com/kaelumjs/kaelum/issues/new?template=feature_request.md)

</div>

---

## Why Kaelum?

<table>
<tr>
<td width="50%">

**Without Kaelum (raw Express)**

```js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/users", listUsers);
app.post("/users", createUser);
app.get("/users/:id", getUser);

app.listen(3000);
```

</td>
<td width="50%">

**With Kaelum** ✨

```js
const kaelum = require("kaelum");
const app = kaelum();

app.setConfig({
  cors: true,
  helmet: true,
  logs: "dev",
  port: 3000,
});

app.apiRoute("users", {
  get: listUsers,
  post: createUser,
  "/:id": { get: getUser },
});

app.start();
```

</td>
</tr>
</table>

> **Less boilerplate. Same Express power. Better DX.**

---

## ⚡ Quick Start

```bash
# Scaffold a new project
npx kaelum create my-app --template web

# Or an API project
npx kaelum create my-api --template api

# Run it
cd my-app && npm install && npm start
```

> No global install needed — `npx` handles everything.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🚀 **Zero-Config Start** | JSON parsing, static files, EJS views — all pre-configured |
| 🌳 **Tree Routing** | Recursive nested routes with `addRoute` and `apiRoute` |
| 🔒 **Security Built-in** | One-toggle CORS, Helmet, and XSS protection |
| 🛠️ **CLI Scaffolding** | `npx kaelum create` with Web and API templates |
| 📦 **Dual Module** | Works with both `require()` and `import` |
| 🏥 **Health Checks** | Built-in `/health` endpoint with readiness probes |
| ⚡ **Middleware Manager** | Track, add, and remove middleware programmatically |
| 🔄 **Redirects** | Declarative redirect maps with single, array, or object syntax |
| 🛡️ **Error Handler** | Standardized JSON/HTML error responses with hooks |

---

## 📦 Installation

```bash
npm install kaelum
```

```js
// CommonJS
const kaelum = require("kaelum");
const app = kaelum();

// ESM
import kaelum from "kaelum";
const app = kaelum();
```

---

## 🧩 API Overview

### `app.setConfig(options)`

```js
app.setConfig({
  cors: true,           // enable CORS
  helmet: true,         // HTTP security headers
  static: "public",     // serve static files
  logs: "dev",          // morgan request logging
  bodyParser: true,     // JSON + urlencoded (default: on)
  port: 3000,           // preferred port
  views: { engine: "ejs", path: "./views" },
});
```

### `app.addRoute(path, handlers)`

```js
app.addRoute("/dashboard", {
  get: (req, res) => res.render("dashboard"),
  post: handleForm,
  "/settings": {
    get: showSettings,
    put: updateSettings,
  },
});
```

### `app.apiRoute(resource, handlers)`

```js
app.apiRoute("products", {
  get: listAll,
  post: create,
  "/:id": {
    get: getById,
    put: update,
    delete: remove,
    "/reviews": {
      get: getReviews,   // GET /products/:id/reviews
      post: addReview,
    },
  },
});
```

### Other Helpers

```js
app.start(3000);                              // start server
app.setMiddleware("/admin", authMiddleware);   // scoped middleware
app.redirect("/old", "/new", 301);            // redirects
app.healthCheck("/health");                   // health endpoint
app.useErrorHandler({ exposeStack: false });  // error handling
```

---

## 📁 Project Templates

### Web Template

```
my-web-app/
├── public/            # Static assets
├── views/             # EJS templates
├── controllers/       # Route logic (MVC)
├── middlewares/        # Custom middleware
├── routes.js          # Route definitions
├── app.js             # Entry point
└── package.json
```

### API Template

```
my-api/
├── controllers/       # Business logic
├── middlewares/        # Auth, validation
├── routes.js          # API routes
├── app.js             # Entry point
└── package.json
```

---

## 🧪 Testing

```bash
npm test        # run all tests
npm run lint    # check code with ESLint
npm run format  # format code with Prettier
```

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

See also: [Code of Conduct](CODE_OF_CONDUCT.md) · [Security Policy](SECURITY.md)

---

## 🌐 Ecosystem

| Package | Description |
|---------|-------------|
| [kaelum](https://www.npmjs.com/package/kaelum) | Core framework |
| [kaelumjs/docs](https://github.com/kaelumjs/docs) | Documentation site |
| [kaelumjs/.github](https://github.com/kaelumjs/.github) | Shared community standards |

---

## ☕ Support

If Kaelum helps you, consider supporting its development:

<a href='https://ko-fi.com/Z8Z51NK4KT' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

---

## 📝 License

MIT — see [LICENSE](LICENSE).
