// core/responseHelpers.js
// Kaelum - Response Helpers Middleware
//
// Enriches the Express Response object (`res`) with semantic methods
// for standard HTTP responses (e.g., res.ok(), res.badRequest()).
//
// Usage:
//   const responseHelpers = require('./core/responseHelpers');
//   responseHelpers(app);

/**
 * Helper to send response based on payload type.
 * @param {import('express').Response} res
 * @param {any} data
 */
function sendPayload(res, data) {
  if (data === undefined) {
    return res.end();
  }
  if (typeof data === "string") {
    return res.send(data);
  }
  return res.json(data);
}

/**
 * Helper to send error response.
 * @param {import('express').Response} res
 * @param {any} err
 */
function sendError(res, err) {
  if (err === undefined) {
    return res.end();
  }
  if (typeof err === "string") {
    return res.json({ error: err });
  }
  return res.json(err);
}

/**
 * Register response helpers middleware on the app.
 *
 * @param {import('express').Express} app
 * @returns {import('express').Express} app (for chaining)
 */
function responseHelpers(app) {
  // Guard: prevent double-registration
  if (app.locals && app.locals._kaelum_responsehelpers_installed) {
    return app;
  }

  const middleware = (req, res, next) => {
    // 200 OK
    res.ok = function (data) {
      this.status(200);
      return sendPayload(this, data);
    };

    // 201 Created
    res.created = function (data) {
      this.status(201);
      return sendPayload(this, data);
    };

    // 204 No Content
    res.noContent = function () {
      this.status(204);
      return this.end();
    };

    // 400 Bad Request
    res.badRequest = function (err) {
      this.status(400);
      return sendError(this, err);
    };

    // 401 Unauthorized
    res.unauthorized = function (err) {
      this.status(401);
      return sendError(this, err);
    };

    // 403 Forbidden
    res.forbidden = function (err) {
      this.status(403);
      return sendError(this, err);
    };

    // 404 Not Found
    res.notFound = function (err) {
      this.status(404);
      return sendError(this, err);
    };

    // 409 Conflict
    res.conflict = function (err) {
      this.status(409);
      return sendError(this, err);
    };

    // Custom Error
    res.error = function (err, statusCode = 500) {
      this.status(statusCode);
      return sendError(this, err);
    };

    next();
  };

  middleware._kaelum_name = "responseHelpers";

  app.use(middleware);

  if (!app.locals) app.locals = {};
  app.locals._kaelum_responsehelpers_installed = true;

  return app;
}

module.exports = responseHelpers;
