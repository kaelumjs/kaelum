---
title: Testing
description: Test a Kaelum app with real HTTP requests, without starting it.
sidebar:
  order: 11
---

`kaelum/testing` sends real HTTP requests to an app without opening a port of its own. It has no dependencies and works with any test runner.

Point it at your app file. Its `app.start()` does not listen while `testApp` loads it, so the app file needs no changes:

```ts title="test/users.test.ts"
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { testApp } from "kaelum/testing";

const client = await testApp(() => import("../src/app.ts"));
after(() => client.close());

test("creates a user", async () => {
  const res = await client.post("/users", { name: "Ada" }, { headers: { "x-api-key": "secret" } });

  assert.equal(res.status, 201);
  assert.equal(res.body.name, "Ada");
});

test("rejects an invalid body", async () => {
  const res = await client.post("/users", { name: "" }, { headers: { "x-api-key": "secret" } });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});
```

Run it with `node --test`, or use the same client with Vitest or Jest.

An app built in the test itself works too: `testApp(app)`.

## Requests

| Method | |
| --- | --- |
| `client.get(path, options?)` | also `head`, `delete` |
| `client.post(path, body?, options?)` | also `put`, `patch` |
| `client.request(method, path, options?)` | any method |

Options: `headers`, `query` (an object appended to the path), and `body` for `request()`. An object body is sent as JSON; a string is sent as is.

## Responses

| Field | |
| --- | --- |
| `status` | the status code |
| `headers` | a `Headers` object: `res.headers.get("x-request-id")` |
| `body` | parsed JSON for JSON responses, the text otherwise, `undefined` when empty |
| `text` | the raw body |

Redirects are not followed, so they can be asserted on.

## Tips

- Request logs are off when `NODE_ENV` is `test`. The templates set it at the top of the test file.
- An app loaded by `testApp(() => import(...))` installs no signal handlers and opens no port until the first request.
