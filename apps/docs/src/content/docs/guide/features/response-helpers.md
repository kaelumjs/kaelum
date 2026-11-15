---
title: "Response Helpers"
description: Semantic utility methods for standardized HTTP responses.
sidebar:
  order: 5
---

Kaelum provides an optional, opt-in middleware to enrich the Express `Response` (`res`) object with semantic helper methods. 

Instead of writing boilerplate Express code (`res.status(200).json(...)`), you can use clean, readable shortcuts inspired by modern frameworks.

## Why use Response Helpers?

- **Semantic readability:** `res.notFound()` is easier to understand at a glance than `res.status(404).send()`.
- **Automatic Content-Type:** Passing a string automatically sends `text/html`, while passing an object or array sends `application/json`.
- **Standardized Error Formatting:** Error methods (400-500) automatically format string messages into a structured JSON payload: `{ "error": "Message" }`.

## Enabling the Feature

To prevent conflicts with other Express middleware you might be using, Response Helpers are **opt-in**. You must enable them globally:

```js
const kaelum = require('kaelum');
const app = kaelum();

// Enable the helpers
app.useResponseHelpers();

app.get('/users/:id', (req, res) => {
  const user = db.find(req.params.id);
  
  if (!user) {
    // 404 Not Found -> { "error": "User not found" }
    return res.notFound("User not found");
  }

  // 200 OK -> JSON payload
  return res.ok(user);
});
```

## Available Methods

Once enabled, the following methods are attached to `res`:

| Method | HTTP Status | Use Case |
|--------|-------------|----------|
| `res.ok(data)` | 200 | Successful query or operation |
| `res.created(data)` | 201 | Resource successfully created |
| `res.noContent()` | 204 | Successful operation, no body to return |
| `res.badRequest(err)`| 400 | Validation failed, malformed request |
| `res.unauthorized(err)`| 401 | Missing or invalid authentication |
| `res.forbidden(err)`| 403 | Authenticated, but lacks permissions |
| `res.notFound(err)` | 404 | Resource does not exist |
| `res.conflict(err)` | 409 | Resource already exists or state conflict |
| `res.error(err, status)`| Custom / 500 | Server error or custom status code |

See the [`useResponseHelpers()` API Reference](/kaelum/api-reference/use-response-helpers/) for technical details.
