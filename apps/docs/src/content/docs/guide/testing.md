---
title: Testing
description: Test a Kaelum app with real HTTP requests, without starting it.
sidebar:
  order: 9
---

`kaelum/testing` sends real HTTP requests to an app without calling `app.start()`. It has no dependencies and works with any test runner.

```ts
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { testApp } from "kaelum/testing";
import { createApp } from "./app.ts";

const client = testApp(createApp());
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

The app is served on a random local port, opened on the first request. Call `close()` when the tests are done.

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

- Build the app in a function (`createApp()`) and start it in a separate file. Tests and the server then use the same app.
- Request logs are off when `NODE_ENV` is `test`. The templates set it at the top of the test file.
- Graceful shutdown hooks only install on `app.start()`, so tests do not touch process signals.
