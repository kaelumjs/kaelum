// core/prettyJson.js
// Middleware that formats JSON responses for readability.
// Supports two modes:
//   - true / 'always': always pretty-prints
//   - 'query': only pretty-prints when ?pretty is in the querystring

/**
 * Sets up pretty JSON formatting on the app.
 *
 * @param {import('express').Application} app
 * @param {boolean|'query'} [mode=true] - true or 'always' = always pretty, 'query' = only when ?pretty present
 */
function setupPrettyJson(app, mode = true) {
  const alwaysPretty = mode === true || mode === "always";
  const queryMode = mode === "query";

  app.use(function kaelumPrettyJson(req, res, next) {
    const shouldPretty = alwaysPretty || (queryMode && req.query.pretty !== undefined);

    if (shouldPretty) {
      const originalJson = res.json.bind(res);
      res.json = function (body) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.send(JSON.stringify(body, null, 2));
      };
    }

    next();
  });
}

module.exports = { setupPrettyJson };
