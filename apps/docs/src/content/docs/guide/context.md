---
title: Context
description: The c argument of every handler, reading the request and sending the response.
sidebar:
  order: 2
---

Every handler receives one argument, the context `c`. It holds the request input, response helpers and a few per-request utilities.

```ts
app.get("/users/:id", async (c) => {
  c.log.info("loading user", { id: c.params.id });
  const user = await db.users.find(c.params.id);
  return user ?? c.notFound("User not found");
});
```

## Responding

There are two ways to respond, and they can be mixed.

**Return a value.** Kaelum sends it when the handler finishes:

| Returned value | Response |
| --- | --- |
| an object, array, number or boolean | `200` with JSON |
| a string | `200` with `text/plain` |
| a `Buffer` | `200` with the bytes |
| `undefined` (nothing) | `204 No Content` |

**Call a helper.** For a status other than 200 or another content type:

```ts
return c.created(user);               // 201 + JSON
return c.noContent();                 // 204
return c.json(data, 202);             // any status
return c.html("<h1>Hi</h1>");         // text/html
return c.text("plain", 200);
return c.redirect("/login");          // 302 by default
return c.notFound("User not found");  // 404 + standard error body
```

A helper sends the response right away. Returning its result tells Kaelum there is nothing left to send, which keeps the handler's return type honest in TypeScript.

### Error helpers

Each sends `{ error: { code, message, details? } }`:

| Helper | Status |
| --- | --- |
| `c.badRequest(message?, details?)` | 400 |
| `c.unauthorized(message?, details?)` | 401 |
| `c.forbidden(message?, details?)` | 403 |
| `c.notFound(message?, details?)` | 404 |
| `c.conflict(message?, details?)` | 409 |
| `c.error(status, message?, details?)` | any |

To stop from deep inside a call stack instead, throw an [`HttpError`](/guide/errors/).

## Reading the request

| Member | What it is |
| --- | --- |
| `c.params` | path params. Typed from the path, or the `params` schema's output |
| `c.query` | query string. The `query` schema's output when there is one |
| `c.body` | parsed body. The `body` schema's output; `unknown` without a schema |
| `c.headers` | request headers, lower-case names |
| `c.id` | the request ID (see [Observability](/guide/observability/)) |
| `c.req.method`, `c.req.path`, `c.req.url` | method, path without query, full URL |
| `c.req.header(name)` | one header, case-insensitive |

Without a schema, `c.body` is typed `unknown` on purpose: nothing has checked its shape. Add a `body` schema to get a typed and validated value. See [Validation](/guide/validation/).

## Response headers

```ts
c.res.header("Cache-Control", "no-store");
if (c.res.sent) return;   // true once the response has started
```

## Per-request values

`c.set` and `c.get` keep values for the rest of the request:

```ts
c.set("startedAt", Date.now());
const startedAt = c.get<number>("startedAt");
```

Express middleware runs before the context exists. To pass data from a middleware to a handler, use `res.locals`:

```ts
const loadUser: Middleware = (req, res, next) => {
  res.locals.user = decodeToken(req.get("authorization"));
  next();
};

app.get("/me", { use: [loadUser], handler: (c) => c.res.raw.locals.user });
```

## Logging

`c.log` writes log records tagged with the request ID:

```ts
c.log.info("order created", { orderId: order.id });
c.log.error("payment failed", { err });
```

Levels: `debug`, `info`, `warn`, `error`. Where the records go is configurable: see [Observability](/guide/observability/#logger).

## The Express objects

`c.req.raw` and `c.res.raw` are the Express request and response, for anything the context does not cover:

```ts
app.get("/report", (c) =>
  new Promise<void>((resolve, reject) => {
    c.res.raw.download("./report.pdf", (err) => (err ? reject(err) : resolve()));
  })
);
```

:::caution
Express methods that send asynchronously (`sendFile`, `download`, streams) must finish before the handler does. Return a promise that resolves when they are done, as above. Returning straight away would make Kaelum answer `204` before the file is sent.
:::
