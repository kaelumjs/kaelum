import type { Server } from "node:http";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response, type Router } from "express";
import helmet from "helmet";
import { resolveOptions, type KaelumOptions, type ResolvedOptions } from "./config.js";
import { doubleSubmit, originCheck } from "./core/csrf.js";
import { ipRestriction } from "./core/ipRestriction.js";
import { createRateLimiter } from "./core/rateLimit.js";
import { createRequestLogger } from "./core/requestLogger.js";
import { serverTiming } from "./core/timing.js";
import { HttpError, errorBody } from "./http-error.js";
import { createLogger, type LogSink, type Logger } from "./logger.js";
import { requestId } from "./middleware/request-id.js";
import { RouteTable } from "./routing/table.js";
import { flattenTree } from "./routing/tree.js";
import type {
  DefinedRoutes,
  Method,
  Middleware,
  ResourceActions,
  RouteInfo,
  RouteTree,
  SingleEndpoint,
} from "./routing/types.js";

/**
 * A plugin: a function that receives the app and sets something up on it
 * (routes, middleware, `onClose` hooks).
 *
 * @example
 * const metrics: Plugin<{ path: string }> = (app, { path }) => {
 *   app.route(path, { get: () => collect() });
 * };
 *
 * app.plugin(metrics, { path: "/metrics" });
 */
export type Plugin<Options = undefined> = (app: Kaelum, options: Options) => void;

type PluginArgs<Options> = undefined extends Options ? [options?: Options] : [options: Options];

/** A function run when the app closes. May be async. */
export type CloseHook = () => unknown;

const RESOURCE_KEYS: ReadonlySet<string> = new Set(["use", "list", "create", "get", "update", "replace", "remove"]);

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

  /** The app's logger. Inside a handler, prefer `c.log`, which adds the request ID. */
  readonly log: Logger;

  readonly #router: Router;
  readonly #table: RouteTable;
  readonly #shutdown: ResolvedOptions["shutdown"];
  readonly #closeHooks: CloseHook[] = [];
  readonly #signalHandlers = new Map<NodeJS.Signals, () => void>();
  #server: Server | undefined;
  #closing: Promise<void> | undefined;

  constructor(options: KaelumOptions = {}) {
    const config = resolveOptions(options);
    this.log = createLogger(config.logger);
    this.#shutdown = config.shutdown;

    this.express = express();
    this.express.disable("x-powered-by");
    this.express.set("trust proxy", config.trustProxy);
    this.express.set("query parser", config.query);

    for (const middleware of builtInMiddleware(config)) this.express.use(middleware);

    // Everything the user adds goes into this router, so it always runs before
    // the 404 and error handlers below, no matter when it is added.
    this.#router = express.Router();
    this.#table = new RouteTable(this.#router, config.logger);
    this.express.use(this.#router);

    if (config.health) {
      const { path, check } = config.health;
      this.route(path, { get: healthHandler(check) } as RouteTree<unknown, string>);
    }

    this.express.use(notFound);
    this.express.use(errorHandler(config.logger));
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

  /** Register a single `GET` endpoint. Shortcut for `app.route(path, { get })`. */
  get<const P extends string, T extends [unknown]>(path: P, ...endpoint: SingleEndpoint<T, P>): this {
    return this.#single("get", path, endpoint[0]);
  }

  /** Register a single `POST` endpoint. Shortcut for `app.route(path, { post })`. */
  post<const P extends string, T extends [unknown]>(path: P, ...endpoint: SingleEndpoint<T, P>): this {
    return this.#single("post", path, endpoint[0]);
  }

  /** Register a single `PUT` endpoint. Shortcut for `app.route(path, { put })`. */
  put<const P extends string, T extends [unknown]>(path: P, ...endpoint: SingleEndpoint<T, P>): this {
    return this.#single("put", path, endpoint[0]);
  }

  /** Register a single `PATCH` endpoint. Shortcut for `app.route(path, { patch })`. */
  patch<const P extends string, T extends [unknown]>(path: P, ...endpoint: SingleEndpoint<T, P>): this {
    return this.#single("patch", path, endpoint[0]);
  }

  /** Register a single `DELETE` endpoint. Shortcut for `app.route(path, { delete })`. */
  delete<const P extends string, T extends [unknown]>(path: P, ...endpoint: SingleEndpoint<T, P>): this {
    return this.#single("delete", path, endpoint[0]);
  }

  /**
   * Register the routes of a CRUD resource by convention.
   *
   * @example
   * app.resource("/users", {
   *   list: () => db.users.all(),                      // GET    /users
   *   create: { body: NewUser, handler: createUser },  // POST   /users
   *   get: (c) => db.users.find(c.params.id),          // GET    /users/:id
   *   update: (c) => db.users.patch(c.params.id, c.body), // PATCH /users/:id
   *   remove: (c) => db.users.delete(c.params.id),     // DELETE /users/:id
   * });
   */
  resource<const P extends string, T>(path: P, actions: ResourceActions<T, P>): this {
    if (typeof actions !== "object" || actions === null || Array.isArray(actions)) {
      throw new TypeError(`resource ${path}: expected an object of actions`);
    }

    const given = actions as Record<string, unknown>;
    const unknown = Object.keys(given).find((key) => !RESOURCE_KEYS.has(key));
    if (unknown !== undefined) {
      throw new TypeError(
        `resource ${path}: unknown key "${unknown}". Expected ${[...RESOURCE_KEYS].join(", ")}`
      );
    }

    const item = defined({ get: given.get, patch: given.update, put: given.replace, delete: given.remove });
    const tree = defined({
      use: given.use,
      get: given.list,
      post: given.create,
      "/:id": Object.keys(item).length > 0 ? item : undefined,
    });

    return this.route({ path, tree });
  }

  /**
   * Run a plugin against this app.
   *
   * @example
   * app.plugin(metrics, { path: "/metrics" });
   */
  plugin<Options = undefined>(plugin: Plugin<Options>, ...[options]: PluginArgs<Options>): this {
    if (typeof plugin !== "function") {
      throw new TypeError(`plugin: expected a function, got ${typeof plugin}`);
    }
    plugin(this, options as Options);
    return this;
  }

  /**
   * Run a function when the app closes, after open requests have finished:
   * the place to close database connections, flush queues and the like.
   * Hooks run in the order they were added; a failing hook is logged and
   * does not stop the others.
   */
  onClose(hook: CloseHook): this {
    if (typeof hook !== "function") {
      throw new TypeError(`onClose: expected a function, got ${typeof hook}`);
    }
    this.#closeHooks.push(hook);
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
        this.#watchSignals();
        resolve(server);
      });
      server.once("error", reject);
    });
  }

  /**
   * Stop listening, wait for open requests to finish (up to the shutdown
   * timeout), then run the `onClose` hooks. Safe to call more than once.
   */
  close(): Promise<void> {
    return (this.#closing ??= this.#close().finally(() => {
      this.#closing = undefined;
    }));
  }

  async #close(): Promise<void> {
    this.#unwatchSignals();

    const server = this.#server;
    this.#server = undefined;
    if (server) await closeServer(server, this.#shutdown ? this.#shutdown.timeout : 10_000);

    for (const hook of this.#closeHooks) {
      try {
        await hook();
      } catch (err) {
        this.log.error("onClose hook failed", { err });
      }
    }
  }

  #single(method: Method, path: string, endpoint: unknown): this {
    return this.route({ path, tree: { [method]: endpoint } });
  }

  #watchSignals(): void {
    if (!this.#shutdown) return;

    for (const signal of this.#shutdown.signals) {
      const handler = (): void => {
        this.log.info(`Received ${signal}, shutting down`);
        this.close().then(
          () => process.exit(0),
          () => process.exit(1)
        );
      };
      this.#signalHandlers.set(signal, handler);
      process.on(signal, handler);
    }
  }

  #unwatchSignals(): void {
    for (const [signal, handler] of this.#signalHandlers) process.removeListener(signal, handler);
    this.#signalHandlers.clear();
  }
}

/** Close a server, cutting the connections still open after `timeout` ms. */
function closeServer(server: Server, timeout: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => server.closeAllConnections(), timeout);
    timer.unref();

    server.close(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/** A copy of `object` without its `undefined` values. */
function defined(object: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
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
  if (config.timing) stack.push(serverTiming(config.timing));
  if (config.helmet) stack.push(helmet(config.helmet));
  if (config.cors) stack.push(cors(config.cors));

  // Cheap rejections come before the body is read.
  if (config.ipRestriction) stack.push(ipRestriction(config.ipRestriction));
  if (config.rateLimit) stack.push(createRateLimiter(config.rateLimit));
  if (config.csrf) {
    const { strategy = "origin", ...csrfOptions } = config.csrf;
    stack.push(strategy === "token" ? doubleSubmit(csrfOptions) : originCheck(csrfOptions));
  }

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

function errorHandler(sink: LogSink) {
  return (err: unknown, req: Request, res: Response, next: NextFunction): void => {
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

    createLogger(sink, req.id).error(`Unhandled error in ${req.method} ${req.path}`, { err });
    res.status(500).json(errorBody(500));
  };
}

function statusOf(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const { status, statusCode } = err as { status?: unknown; statusCode?: unknown };
  const value = typeof status === "number" ? status : statusCode;
  return typeof value === "number" && value >= 400 && value < 600 ? value : undefined;
}
