---
title: "notFound() / useMethodNotAllowed()"
description: API reference for Kaelum's 404 and 405 handlers.
sidebar:
  order: 14
---

## app.notFound(handler?)

Registers a catch-all 404 Not Found middleware. Must be registered **after** all your routes.

```js
app.notFound();
app.notFound((req, res) => res.status(404).send("Page not found"));
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `handler` | `RequestHandler` | JSON default | Optional custom handler |

### Returns

`KaelumApp` — the app instance for chaining.

---

## app.useMethodNotAllowed(options?)

Intercepts requests where the path exists, but the HTTP method doesn't, returning a `405 Method Not Allowed` with the `Allow` header populated with the accepted methods.

Must be registered **after** your routes and **before** `app.notFound()`.

```js
app.useMethodNotAllowed();

app.useMethodNotAllowed({
  handler: (req, res, allowedMethods) => {
    res.status(405).json({ allowed: allowedMethods });
  }
});
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.handler` | `Function` | JSON default | Optional handler function `(req, res, allowedMethods) => void` |

### Returns

`KaelumApp` — the app instance for chaining.

---

## MethodNotAllowedOptions

```ts
interface MethodNotAllowedOptions {
  handler?: (req: Request, res: Response, allowedMethods: string[]) => any;
}
```
