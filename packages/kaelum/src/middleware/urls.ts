// Small URL and response-format middleware enabled through `kaelum({ ... })`.

import type { Middleware } from "../routing/types.js";

/** The query string of the original URL, including the `?`, or "". */
function searchOf(url: string): string {
  const index = url.indexOf("?");
  return index === -1 ? "" : url.slice(index);
}

/** Redirect `GET /users/` to `/users` with a 301, keeping the query string. */
export function trailingSlashRedirect(): Middleware {
  return (req, res, next) => {
    const { path } = req;
    if ((req.method === "GET" || req.method === "HEAD") && path.length > 1 && path.endsWith("/")) {
      res.redirect(301, path.replace(/\/+$/, "") + searchOf(req.originalUrl));
      return;
    }
    next();
  };
}

/** Redirect exact paths to new locations. */
export function redirectMap(redirects: Map<string, { to: string; status: number }>): Middleware {
  return (req, res, next) => {
    const target = redirects.get(req.path);
    if (!target) return next();
    res.redirect(target.status, target.to);
  };
}

/** Indent JSON responses for requests whose URL has `?pretty`. */
export function prettyJsonOnQuery(): Middleware {
  return (req, res, next) => {
    if (req.query.pretty !== undefined) {
      res.json = (body?: unknown) => {
        if (!res.get("Content-Type")) res.type("json");
        return res.send(JSON.stringify(body, null, 2));
      };
    }
    next();
  };
}
