import type { NextFunction, Request, Response, Router } from "express";
import { Context, RESPONDED } from "../context.js";
import { HttpError } from "../http-error.js";
import { validateInput } from "../schema/validate.js";
import type { FlatRoute } from "./tree.js";
import type { Method, Middleware, RouteInfo } from "./types.js";

type Endpoint = Pick<FlatRoute, "middleware" | "schemas" | "handler">;

/**
 * Kaelum's own record of every route.
 *
 * Each distinct path is registered in Express once, with a dispatcher that
 * picks the endpoint by method at request time. That gives 405 responses with
 * an accurate `Allow` header, lets methods be added to a path later, and makes
 * `app.routes()` possible without reading Express internals.
 */
export class RouteTable {
  #paths = new Map<string, Map<Method, Endpoint>>();

  constructor(private readonly router: Router) {}

  has(method: Method, path: string): boolean {
    return this.#paths.get(path)?.has(method) ?? false;
  }

  add(route: FlatRoute): void {
    let methods = this.#paths.get(route.path);

    if (!methods) {
      methods = new Map();
      this.#paths.set(route.path, methods);
      this.router.all(route.path, this.#dispatcher(methods));
    }

    if (methods.has(route.method)) {
      throw new Error(`route ${route.method.toUpperCase()} ${route.path} is already registered`);
    }

    methods.set(route.method, {
      middleware: route.middleware,
      schemas: route.schemas,
      handler: route.handler,
    });
  }

  list(): RouteInfo[] {
    const routes: RouteInfo[] = [];
    for (const [path, methods] of this.#paths) {
      for (const method of methods.keys()) {
        routes.push({ method: method.toUpperCase() as RouteInfo["method"], path });
      }
    }
    return routes;
  }

  #dispatcher(methods: Map<Method, Endpoint>) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const method = req.method.toLowerCase() as Method;
      // HEAD is answered by the GET endpoint when there is no HEAD one; Node drops the body.
      const endpoint = methods.get(method) ?? (method === "head" ? methods.get("get") : undefined);

      if (!endpoint) {
        const allow = allowHeader(methods);
        res.setHeader("Allow", allow);
        if (method === "options") {
          res.status(204).end();
          return;
        }
        next(new HttpError(405, undefined, { details: { allow: allow.split(", ") } }));
        return;
      }

      runMiddleware(endpoint.middleware, req, res, (err) => {
        if (err !== undefined) return next(err);
        void runHandler(endpoint, req, res, next);
      });
    };
  }
}

function allowHeader(methods: Map<Method, Endpoint>): string {
  const allowed = new Set<string>([...methods.keys()].map((m) => m.toUpperCase()));
  if (allowed.has("GET")) allowed.add("HEAD");
  allowed.add("OPTIONS");
  return [...allowed].join(", ");
}

/** Run Express middleware in order, stopping at the first error or unanswered `next`. */
function runMiddleware(
  middleware: Middleware[],
  req: Request,
  res: Response,
  done: (err?: unknown) => void
): void {
  let index = 0;

  const step = (err?: unknown): void => {
    if (err !== undefined && err !== null) return done(err);
    const fn = middleware[index++];
    if (!fn) return done();

    try {
      // Async middleware that rejects is reported the same way as one calling next(err).
      Promise.resolve(fn(req, res, step)).catch(done);
    } catch (thrown) {
      done(thrown);
    }
  };

  step();
}

async function runHandler(endpoint: Endpoint, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validation runs after the middleware, so auth can reject before the body is inspected.
    const validated = endpoint.schemas
      ? await validateInput(endpoint.schemas, { params: req.params, query: req.query, body: req.body })
      : undefined;

    const result = await endpoint.handler(new Context(req, res, validated));
    sendResult(result, res);
  } catch (err) {
    next(err);
  }
}

/** Turn whatever a handler returned into a response, unless one was already sent. */
function sendResult(result: unknown, res: Response): void {
  if (result === RESPONDED || res.headersSent) return;

  if (result === undefined) {
    res.status(204).end();
  } else if (typeof result === "string") {
    res.type("text/plain").send(result);
  } else if (Buffer.isBuffer(result)) {
    res.send(result);
  } else {
    res.json(result);
  }
}
