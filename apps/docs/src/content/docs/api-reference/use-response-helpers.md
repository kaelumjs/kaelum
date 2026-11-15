---
title: "useResponseHelpers()"
description: Expose semantic response helpers on the res object.
sidebar:
  order: 8
---

## Signature

```js
app.useResponseHelpers()
```

## Description

Installs an application-level middleware that extends the Express `Response` object (`res`) with semantic, chainable helper methods for standard HTTP status codes.

This method returns the `KaelumApp` instance, allowing it to be chained with other configuration methods.

## Examples

```js
// Enable globally
app.useResponseHelpers();

app.post('/api/data', (req, res) => {
  try {
    const data = processData(req.body);
    // Returns 201 Created with JSON body
    res.created(data); 
  } catch (err) {
    // Returns 400 Bad Request with { "error": "Invalid format" }
    res.badRequest("Invalid format");
  }
});
```

## Response Formatting Behavior

All helpers (except `noContent`) accept a payload parameter and dynamically determine how to respond:

- **String payload:** Sent as `text/html` (or mapped to `{ "error": "string" }` for error methods).
- **Object/Array payload:** Sent as `application/json`.
- **Undefined payload:** Ends the response without a body.

## Provided Methods

### Success Helpers
- `res.ok([data])`: Sets status to `200 OK`.
- `res.created([data])`: Sets status to `201 Created`.
- `res.noContent()`: Sets status to `204 No Content` and ends the response.

### Error Helpers
*If passed a string, error helpers automatically format the response as `{ "error": "Your string here" }`.*

- `res.badRequest([err])`: Sets status to `400 Bad Request`.
- `res.unauthorized([err])`: Sets status to `401 Unauthorized`.
- `res.forbidden([err])`: Sets status to `403 Forbidden`.
- `res.notFound([err])`: Sets status to `404 Not Found`.
- `res.conflict([err])`: Sets status to `409 Conflict`.
- `res.error([err], [statusCode=500])`: Sets status to the provided `statusCode` (defaults to `500 Internal Server Error`).
