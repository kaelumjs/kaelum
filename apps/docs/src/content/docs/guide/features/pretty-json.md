---
title: "Pretty JSON"
description: Format JSON responses for readability with query-string or always-on modes.
sidebar:
  order: 7
---

By default, Kaelum (like Express) sends compact JSON: `{"hello":"world"}`. Enabling **Pretty JSON** adds 2-space indentation so the output is human-readable — useful for development and browser-facing APIs.

## Always-on

```js
const app = require("kaelum")();

app.usePrettyJson();

app.get("/hello", (req, res) => res.json({ message: "Hello World" }));
```

Response:
```json
{
  "message": "Hello World"
}
```

## Query-string mode

Only format when the client sends `?pretty` in the URL:

```js
app.usePrettyJson("query");
```

```
GET /users       → {"users":[]}
GET /users?pretty →
{
  "users": []
}
```

## Via setConfig

```js
app.setConfig({
  prettyJson: true,      // always-on
  prettyJson: "query",   // query-triggered
});
```

> **Tip:** Pretty JSON is great during development. In production, consider keeping it off (default) or in query mode to avoid unnecessary JSON serialization overhead.
