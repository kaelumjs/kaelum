import type { Server } from "node:http";
import express, { type Express, type NextFunction, type Request, type Response, type Router } from "express";
import { HttpError, errorBody } from "./http-error.js";
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

  constructor() {
    this.express = express();
    this.express.disable("x-powered-by");
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));

    // Everything the user adds goes into this router, so it always runs before
    // the 404 and error handlers below, no matter when it is added.
    this.#router = express.Router();
    this.#table = new RouteTable(this.#router);
    this.express.use(this.#router);

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

/** Create a Kaelum app. */
export function createKaelum(): Kaelum {
  return new Kaelum();
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
