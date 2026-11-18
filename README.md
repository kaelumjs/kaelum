<div align="center">

<img src=".github/logo.svg" alt="Kaelum" width="120" />

<h1>Kaelum</h1>

<p><strong>Express, production-ready by default</strong></p>

[![npm version](https://img.shields.io/npm/v/kaelum?color=blue)](https://www.npmjs.com/package/kaelum)
[![npm downloads](https://img.shields.io/npm/dm/kaelum?color=green)](https://www.npmjs.com/package/kaelum)
[![CI](https://github.com/kaelumjs/kaelum/actions/workflows/test.yml/badge.svg)](https://github.com/kaelumjs/kaelum/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[📚 Documentation](https://kaelumjs.matthcodes.dev) · [🐛 Report Bug](https://github.com/kaelumjs/kaelum/issues/new?template=bug_report.md) · [💡 Request Feature](https://github.com/kaelumjs/kaelum/issues/new?template=feature_request.md)

</div>

---

## Why Kaelum?

Kaelum is Express with the setup already done. One call gives you security headers, a body size limit, request IDs, request logs, a health check, graceful shutdown and a consistent JSON error format. Routes are declared as a tree, and handlers get a typed `c` context.

```ts
import kaelum, { k } from "kaelum";

const app = kaelum();

const NewUser = k.object({ name: k.string(), email: k.string() });

app.route("/users", {
  get: () => db.users.all(),

  post: {
    body: NewUser,
    handler: (c) => c.created(db.users.create(c.body)), // c.body is { name: string; email: string }
  },

  "/:id": {
    use: [auth],
    get: (c) => db.users.find(c.params.id),             // c.params.id is a string
    delete: (c) => c.noContent(),
  },
});

await app.start(3000);
```

- **Production defaults**: Helmet, body limit, request IDs, logs, `GET /health` and graceful shutdown are on. CORS, rate limiting, CSRF and IP restriction are one option away.
- **Typed route trees**: path params, body, query and the handler's `c` are inferred. No generics to write.
- **Validation from any schema**: Zod, Valibot, ArkType or the built-in `k` builder, through Standard Schema. Invalid input answers 400 with every issue listed.
- **Still Express**: any Express middleware works with `app.use()`, and `app.handler` mounts a Kaelum app inside an existing Express app.

## Install

```bash
npm install kaelum@next
```

Requires Node.js 24.22.1 or later. Kaelum is ESM; `require("kaelum")` works too, through Node's `require(esm)`.

## A quick tour

```ts
import kaelum, { rateLimit } from "kaelum";

const app = kaelum({
  security: { cors: { origin: "https://app.example" } },
  trustProxy: true,
});

// CRUD by convention: GET/POST /posts, GET/PATCH/PUT/DELETE /posts/:id
app.resource("/posts", {
  list: () => db.posts.all(),
  get: (c) => db.posts.find(c.params.id),
  remove: (c) => c.noContent(),
});

// A single route, with its own middleware
app.post("/login", { use: [rateLimit({ max: 5 })], handler: login });

// Errors become { error: { code, message } }
app.get("/teapot", (c) => c.error(418, "I'm a teapot"));

// Logs carry the request ID
app.get("/hello", (c) => {
  c.log.info("saying hello");
  return "hello";
});

// Runs on SIGTERM/SIGINT, after open requests finish
app.onClose(() => db.close());
```

Testing, without starting the server:

```ts
import { testApp } from "kaelum/testing";

const client = testApp(app);
const res = await client.post("/users", { name: "Ada", email: "ada@example.com" });
expect(res.status).toBe(201);
await client.close();
```

## Status

Kaelum 2.0 is in alpha: the API may still change between alphas. Version 1.x, with the `app.setConfig` / `app.addRoute` API, is in maintenance on the [`v1`](https://github.com/kaelumjs/kaelum/tree/v1) branch.

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](https://github.com/kaelumjs/.github/blob/main/CONTRIBUTING.md) before submitting a PR.

See also: [Code of Conduct](https://github.com/kaelumjs/.github/blob/main/CODE_OF_CONDUCT.md) · [Security Policy](https://github.com/kaelumjs/.github/blob/main/SECURITY.md)

---

## 🌐 Ecosystem

| Package                                                 | Description                |
| ------------------------------------------------------- | -------------------------- |
| [kaelum](https://www.npmjs.com/package/kaelum)          | Core framework             |
| [create-kaelum](https://www.npmjs.com/package/create-kaelum) | Project scaffolding    |
| [kaelumjs/.github](https://github.com/kaelumjs/.github) | Shared community standards |

---

## ☕ Support

If Kaelum helps you, consider supporting its development:

<a href='https://ko-fi.com/Z8Z51NK4KT' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

---

## 📝 License

MIT — see [LICENSE](LICENSE).
