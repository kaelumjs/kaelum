---
title: Errors
description: The error format, HttpError and what happens to unexpected errors.
sidebar:
  order: 4
---

Every error response from Kaelum has the same shape:

```json
{ "error": { "code": "NOT_FOUND", "message": "User not found", "details": { "id": "42" } } }
```

`code` is meant for programs, `message` for people, and `details` is present only when there is something to add. 404s, 405s, validation failures, rate limiting and the security middleware all use it, so a client needs one error handler.

## Throwing an error

Throw an `HttpError` anywhere in a handler, or in a function it calls:

```ts
import { HttpError } from "kaelum";

async function findUser(id: string) {
  const user = await db.users.find(id);
  if (!user) throw new HttpError(404, "User not found", { details: { id } });
  return user;
}

app.get("/users/:id", (c) => findUser(c.params.id));
```

`new HttpError(status, message?, options?)`:

| Option | |
| --- | --- |
| `code` | machine-readable code. Default: derived from the status (`NOT_FOUND`, `CONFLICT`, ...) |
| `details` | extra data sent under `error.details` |
| `cause` | the original error, for logs. Never sent to the client |

Inside a handler, the [error helpers](/guide/context/#error-helpers) (`c.notFound()`, `c.conflict()`, ...) do the same without throwing.

## Default codes

| Status | Code |
| --- | --- |
| 400 | `BAD_REQUEST` (`VALIDATION_ERROR` for schema failures) |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 405 | `METHOD_NOT_ALLOWED` |
| 409 | `CONFLICT` |
| 422 | `UNPROCESSABLE_ENTITY` |
| 429 | `TOO_MANY_REQUESTS` |
| 500 | `INTERNAL_ERROR` |
| 503 | `SERVICE_UNAVAILABLE` |

## Unexpected errors

Anything else thrown, or a rejected promise, becomes a `500` with a generic message:

```json
{ "error": { "code": "INTERNAL_ERROR", "message": "Internal Server Error" } }
```

The real error never reaches the client, so stack traces and database messages do not leak. It goes to the [logger](/guide/observability/#logger) with the request ID, so you can find it from the `X-Request-Id` the client got.

## Custom error responses

`onError` runs for every error that reaches Kaelum (thrown errors, 404s, validation failures) before the default response:

```ts
const app = kaelum({
  onError: (err, c) => {
    reportToSentry(err);

    // HTML pages for browsers, the default JSON for everything else.
    if (c.req.header("accept")?.includes("text/html")) return c.render("error");
  },
});
```

- Return a value, or use `c.*`, to replace the response. It keeps the error's status unless you pass another.
- Return nothing to keep the default response.
- Unexpected errors are logged either way. If `onError` itself throws, that is logged and the default response is sent.

For pages that do not exist, [`notFound`](/guide/pages/#custom-404-page) is usually simpler.

## Errors from Express middleware

Errors from Express middleware that carry a 4xx `status`, such as a malformed JSON body or a body over the size limit, keep their status and message.
