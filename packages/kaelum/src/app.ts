import type { Server } from "node:http";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response, type Router } from "express";
import helmet from "helmet";
import { resolveOptions, type KaelumOptions, type ResolvedOptions } from "./config.js";
import { createRequestLogger } from "./core/requestLogger.js";
import { HttpError, errorBody } from "./http-error.js";
import { requestId } from "./middleware/request-id.js";
import { RouteTable } from "./routing/table.js";
import { flattenTree } from "./routing/tree.js";
import type { DefinedRoutes, Middleware, RouteInfo, RouteTree } from "./routing/types.js";

/**
 * A Kaelum application.
 *
 * It owns an Express app but is not one: routes are declared with `route()`
 * and handlers receive a `Context`. The Express app stays reachable through
 * `app.express`, and any Express middleware works with `app.use()`.
 */
export class Kaelum {
  /**
   * The underlying Express app. Prefer `app.use()` to add middleware: anything
   * added here directly runs after Kaelum's 404 and error handlers.
   */
  readonly express: Express;

  readonly #router: Router;
  readonly #table: RouteTable;
  #server: Server | undefined;

  constructor(options: KaelumOptions = {}) {
    const config = resolveOptions(options);

    this.express = express();
    this.express.disable("x-powered-by");
    this.express.set("trust proxy", config.trustProxy);
    this.express.set("query parser", config.query);

    for (const middleware of builtInMiddleware(config)) this.express.use(middleware);

    // Everything the user adds goes into this router, so it always runs before
    // the 404 and error handlers below, no matter when it is added.
    this.#router = express.Router();
    this.#table = new RouteTable(this.#router);
    this.express.use(this.#router);

    if (config.health) {
      const { path, check } = config.health;
      this.route(path, { get: healthHandler(check) } as RouteTree<unknown, string>);
    }

    this.express.use(notFound);
    this.express.use(handleError);
  }

  /**
   * A plain `(req, res)` function for the whole app. Use it to mount Kaelum
   * inside an existing Express app or to hand it to `http.createServer`.
   *
   * @example
   * legacyExpressApp.use("/v2", app.handler);
   */
  get handler(): (req: Request, res: Response) => void {
    return this.express;
  }

  /** Add Express middleware, optionally limited to a path prefix. */
  use(...middleware: Middleware[]): this;
  use(path: string, ...middleware: Middleware[]): this;
  use(...args: [string | Middleware, ...Middleware[]]): this {
    (this.#router.use as (...a: unknown[]) => unknown)(...args);
    return this;
  }

  /**
   * Register a tree of routes.
   *
   * @example
   * app.route("/users", {
   *   get: () => listUsers(),
   *   "/:id": {
   *     use: [auth],
   *     get: (c) => findUser(c.params.id),
   *   },
   * });
   */
  route<const P extends string, T>(path: P, tree: RouteTree<T, P>): this;
  route(routes: DefinedRoutes): this;
  route(pathOrRoutes: string | DefinedRoutes, tree?: unknown): this {
    const [path, routes] =
      typeof pathOrRoutes === "string" ? [pathOrRoutes, tree] : [pathOrRoutes.path, pathOrRoutes.tree];

    // Validate the whole tree before registering anything, so a mistake
    // deep in it does not leave half of the routes registered.
    const flat = flattenTree(path, routes);
    const seen = new Set<string>();
    for (const { method, path: routePath } of flat) {
      const key = `${method} ${routePath}`;
      if (seen.has(key) || this.#table.has(method, routePath)) {
        throw new Error(`route ${method.toUpperCase()} ${routePath} is already registered`);
      }
      seen.add(key);
    }

    for (const route of flat) this.#table.add(route);
    return this;
  }

  /** Every registered endpoint, in registration order. */
  routes(): RouteInfo[] {
    return this.#table.list();
  }

  /**
   * Start listening. Resolves with the server once it is ready.
   * Defaults to `process.env.PORT`, then 3000.
   */
  start(port: number | string = process.env.PORT ?? 3000): Promise<Server> {
    if (this.#server) {
      return Promise.reject(new Error("Kaelum: the app is already started"));
    }

    return new Promise((resolve, reject) => {
      const server = this.express.listen(Number(port));
      server.once("listening", () => {
        this.#server = server;
        resolve(server);
      });
      server.once("error", reject);
    });
  }

  /** Stop listening and wait for open connections to finish. */
  close(): Promise<void> {
    const server = this.#server;
    if (!server) return Promise.resolve();

    this.#server = undefined;
    return new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

/**
 * Create a Kaelum app. With no options it starts with production-ready
 * defaults: security headers, a body size limit, request IDs, request logs
 * and `GET /health`.
 */
export function createKaelum(options?: KaelumOptions): Kaelum {
  return new Kaelum(options);
}

/** The middleware Kaelum installs before any user code, in order. */
function builtInMiddleware(config: ResolvedOptions): Middleware[] {
  const stack: Middleware[] = [];

  // First, so the ID is available to the logger and to every later error.
  if (config.requestId) stack.push(requestId(config.requestId));
  if (config.logs) stack.push(createRequestLogger(config.logs));
  if (config.helmet) stack.push(helmet(config.helmet));
  if (config.cors) stack.push(cors(config.cors));

  if (config.body) {
    const { limit, json, urlencoded } = config.body;
    if (json) stack.push(express.json({ limit }));
    if (urlencoded) stack.push(express.urlencoded({ limit, extended: config.query === "extended" }));
  }

  return stack;
}

function healthHandler(check: (() => unknown) | undefined) {
  return async () => {
    if (check) {
      let ready: unknown;
      try {
        ready = await check();
      } catch (cause) {
        throw new HttpError(503, "Health check failed", { cause });
      }
      if (ready === false) throw new HttpError(503, "Health check failed");
    }
    return { status: "ok" };
  };
}

/**
 * Declare a route tree away from the app, for example in its own file.
 * The full path is given up front so `c.params` is typed.
 *
 * @example
 * export const userRoutes = defineRoutes("/orgs/:orgId/users")({
 *   get: (c) => listUsers(c.params.orgId),
 * });
 *
 * app.route(userRoutes);
 */
export function defineRoutes<const P extends string>(path: P) {
  return <T>(tree: RouteTree<T, P>): DefinedRoutes<P> => ({
    path,
    tree: tree as Record<string, unknown>,
  });
}

function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404));
}

function handleError(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  // The response already started: all that is left is to let Express close it.
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    res.status(err.status).json(err.toJSON());
    return;
  }

  // Errors from body parsers and other Express middleware carry a status.
  const status = statusOf(err);
  if (status !== undefined && status < 500) {
    res.status(status).json(errorBody(status, (err as Error).message));
    return;
  }

  console.error(err);
  res.status(500).json(errorBody(500));
}

function statusOf(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const { status, statusCode } = err as { status?: unknown; statusCode?: unknown };
  const value = typeof status === "number" ? status : statusCode;
  return typeof value === "number" && value >= 400 && value < 600 ? value : undefined;
}
