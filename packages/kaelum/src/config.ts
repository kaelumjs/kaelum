import type { HelmetOptions } from "helmet";
import type { CsrfOptions } from "./middleware/csrf.js";
import type { IpRestrictionOptions } from "./middleware/ip-restriction.js";
import type { RateLimitOptions } from "./middleware/rate-limit.js";
import type { RequestLogFormat } from "./middleware/request-logger.js";
import type { TimingOptions } from "./middleware/timing.js";
import path from "node:path";
import type { Context } from "./context.js";
import { defaultLogSink, type LogSink } from "./logger.js";
import type { ServeStaticOptions } from "./middleware/static.js";

export interface StaticOptions extends ServeStaticOptions {
  /** Folder to serve, relative to the project root. */
  dir: string;
  /** URL prefix the files are served under. Default `/`. */
  prefix?: string;
}

export interface ViewsOptions {
  /**
   * Package name of the view engine, installed in the project. Default `"ejs"`.
   * Any engine that works with Express works: `"pug"`, `"hbs"`, ...
   */
  engine?: string;
  /** Folder with the templates, relative to the project root. Default `"views"`. */
  dir?: string;
}

export type RedirectTarget = string | { to: string; status?: 301 | 302 | 303 | 307 | 308 };

/** CSRF protection options. */
export interface CsrfConfig extends CsrfOptions {
  /**
   * - `"origin"` (default): reject state-changing requests whose `Origin` or
   *   `Referer` is not allowed. Needs nothing from the client.
   * - `"token"`: double-submit cookie. The client must echo the `csrf-token`
   *   cookie in the `X-CSRF-Token` header.
   */
  strategy?: "origin" | "token";
}

/** Options for cross-origin requests. Passed to the `cors` package. */
export interface CorsOptions {
  /** Allowed origin(s). `true` reflects the request origin; `"*"` allows any. */
  origin?: boolean | string | RegExp | Array<string | RegExp>;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  /** Send `Access-Control-Allow-Credentials`. Never combine with `origin: "*"`. */
  credentials?: boolean;
  /** Seconds a preflight response may be cached. */
  maxAge?: number;
}

export interface RequestIdOptions {
  /** Header read from the request and written to the response. Default `X-Request-Id`. */
  header?: string;
  /** Creates an ID when the request has none. Default `crypto.randomUUID`. */
  generate?: () => string;
}

export interface HealthOptions {
  /** Default `/health`. */
  path?: string;
  /**
   * Readiness check, run on every request to the health endpoint. Throwing or
   * returning `false` answers 503. Any other return value is ignored.
   */
  check?: () => unknown;
}

export interface ShutdownOptions {
  /** Milliseconds to wait for open requests before closing their connections. Default 10000. */
  timeout?: number;
  /** Signals that start the shutdown. Default `SIGTERM` and `SIGINT`. */
  signals?: NodeJS.Signals[];
}

export interface BodyOptions {
  /** Largest accepted body, as bytes or a string such as `"1mb"`. Default `"100kb"`. */
  limit?: number | string;
  /** Parse `application/json` bodies. Default `true`. */
  json?: boolean;
  /** Parse `application/x-www-form-urlencoded` bodies. Default `true`. */
  urlencoded?: boolean;
}

/**
 * Everything that can be configured when creating an app.
 *
 * Kaelum starts with production-ready defaults: security headers, a body size
 * limit, request IDs, request logs and a health check are all on. Each option
 * below turns a default off or adjusts it.
 */
export interface KaelumOptions {
  security?: {
    /** Security headers via Helmet. Default on. `false` disables, an object configures. */
    helmet?: boolean | HelmetOptions;
    /** Cross-origin requests. Default off. `true` allows any origin, an object configures. */
    cors?: boolean | CorsOptions;
    /**
     * Limit requests per client for the whole app. Default off. `true` allows
     * 100 requests per 15 minutes per IP. Behind a proxy, set `trustProxy` too,
     * or every client shares the proxy's IP. For one route, use `rateLimit()` in `use`.
     */
    rateLimit?: boolean | RateLimitOptions;
    /** CSRF protection for state-changing requests. Default off. `true` uses the origin check. */
    csrf?: boolean | CsrfConfig;
    /** Allow or deny clients by IP or CIDR range. `allow` always wins over `deny`. */
    ipRestriction?: IpRestrictionOptions;
  };

  observability?: {
    /** `X-Request-Id` on every request and response, and `c.id`. Default on. */
    requestId?: boolean | RequestIdOptions;
    /**
     * One log line per request. Default: `"dev"` (colored) in development,
     * `"tiny"` in production, off when `NODE_ENV` is `test`.
     */
    logs?: boolean | RequestLogFormat;
    /** `Server-Timing` header with the time spent handling each request. Default off. */
    timing?: boolean | TimingOptions;
    /**
     * Where `app.log` and `c.log` write. Default: JSON lines in production,
     * the console otherwise. Pass a function to forward records to your own logger.
     */
    logger?: LogSink;
  };

  /**
   * Graceful shutdown on `SIGTERM` and `SIGINT`: stop accepting connections,
   * let open requests finish, run the `onClose` hooks, then exit. Default on.
   */
  shutdown?: boolean | ShutdownOptions;

  /** Body parsing. `false` disables it entirely. */
  body?: false | BodyOptions;

  /**
   * How query strings are parsed. `"simple"` (default) gives flat keys and is
   * the safer choice; `"extended"` turns `filter[tag]=x` into nested objects.
   */
  query?: "simple" | "extended";

  /**
   * Trust `X-Forwarded-*` headers. Needed behind a reverse proxy or load
   * balancer for `req.ip` and HTTPS detection to be right. Default `false`.
   * Accepts the same values as Express's `trust proxy` setting.
   */
  trustProxy?: boolean | number | string | string[];

  /** Health check endpoint. Default `GET /health`. `false` disables, a string sets the path. */
  health?: boolean | string | HealthOptions;

  /**
   * Serve the files in a folder, relative to the project root. Default off.
   *
   * @example
   * kaelum({ static: "public" })
   * kaelum({ static: { dir: "public", prefix: "/assets", maxAge: "1d" } })
   */
  static?: false | string | StaticOptions;

  /**
   * Server-rendered views with `c.render()`. Default off. `true` uses EJS
   * templates from `views/`; install the engine in the project (`npm install ejs`).
   *
   * @example
   * kaelum({ views: true })
   * app.get("/", (c) => c.render("home", { title: "Welcome" }));
   */
  views?: boolean | ViewsOptions;

  /** Port used by `app.start()` when none is passed and `PORT` is not set. Default 3000. */
  port?: number;

  /**
   * `ETag` header on responses, so clients can revalidate with a `304`.
   * Default `"weak"`. `false` disables it.
   */
  etag?: boolean | "weak" | "strong";

  json?: {
    /**
     * Indent JSON responses. `true` always; `"query"` only when the URL has
     * `?pretty`, handy for reading an API in the browser. Default `false`.
     */
    pretty?: boolean | "query";
  };

  /**
   * `"redirect"`: answer `GET /users/` with a 301 to `/users`, so every page
   * has one URL. Default off: `/users/` and `/users` both reach the route.
   */
  trailingSlash?: false | "redirect";

  /**
   * Redirect old paths. A string target uses 302.
   *
   * @example
   * kaelum({
   *   redirects: {
   *     "/blog": "/articles",
   *     "/old-pricing": { to: "/pricing", status: 301 },
   *   },
   * })
   */
  redirects?: Record<string, RedirectTarget>;

  /**
   * Answer requests that match no route. Whatever it returns is sent with a
   * 404 status; returning nothing keeps the default JSON body.
   *
   * @example
   * kaelum({ notFound: (c) => c.render("404") })
   */
  notFound?: (c: Context) => unknown;

  /**
   * Runs for every error that reaches Kaelum, before the default response.
   * Return a response (or use `c.*`) to replace the default one; return
   * nothing to keep it. Unexpected errors are still logged.
   *
   * @example
   * kaelum({
   *   onError: (err, c) => {
   *     reportToSentry(err);
   *     if (c.req.header("accept")?.includes("text/html")) return c.render("error");
   *   },
   * })
   */
  onError?: (err: unknown, c: Context) => unknown;
}

/** `KaelumOptions` with every default filled in. */
export interface ResolvedOptions {
  helmet: false | HelmetOptions;
  cors: false | CorsOptions;
  rateLimit: false | RateLimitOptions;
  csrf: false | CsrfConfig;
  ipRestriction: false | IpRestrictionOptions;
  timing: false | TimingOptions;
  requestId: false | Required<RequestIdOptions>;
  logs: false | RequestLogFormat;
  logger: LogSink;
  shutdown: false | Required<ShutdownOptions>;
  body: false | Required<BodyOptions>;
  query: "simple" | "extended";
  trustProxy: boolean | number | string | string[];
  health: false | (Required<Pick<HealthOptions, "path">> & Pick<HealthOptions, "check">);
  static: false | (StaticOptions & { prefix: string });
  views: false | Required<ViewsOptions>;
  port: number;
  etag: boolean | "weak" | "strong";
  prettyJson: boolean | "query";
  trailingSlash: false | "redirect";
  redirects: Map<string, { to: string; status: number }>;
  notFound: KaelumOptions["notFound"];
  onError: KaelumOptions["onError"];
}

/** `true` means "on with defaults", `false` means off, an object configures. */
function toggle<T extends object>(value: boolean | T | undefined, enabledByDefault: boolean): false | T {
  if (value === undefined) return enabledByDefault ? ({} as T) : false;
  if (typeof value === "boolean") return value ? ({} as T) : false;
  return value;
}

function defaultLogs(env: string | undefined): false | RequestLogFormat {
  if (env === "test") return false;
  return env === "production" ? "tiny" : "dev";
}

/**
 * @param root - folder that relative paths (`static`, `views`) resolve from:
 *   the project root, where the app is started from
 */
export function resolveOptions(
  options: KaelumOptions = {},
  env = process.env.NODE_ENV,
  root = process.cwd()
): ResolvedOptions {
  const { security = {}, observability = {} } = options;

  const requestId = toggle<RequestIdOptions>(observability.requestId, true);
  const shutdown = toggle<ShutdownOptions>(options.shutdown, true);
  const body = options.body === false ? false : (options.body ?? {});
  const health = typeof options.health === "string" ? { path: options.health } : toggle(options.health, true);

  let logs: false | RequestLogFormat;
  if (observability.logs === undefined) logs = defaultLogs(env);
  else if (observability.logs === true) logs = defaultLogs(env) || "dev";
  else logs = observability.logs;

  return {
    helmet: toggle<HelmetOptions>(security.helmet, true),
    cors: toggle<CorsOptions>(security.cors, false),
    rateLimit: toggle<RateLimitOptions>(security.rateLimit, false),
    csrf: toggle<CsrfConfig>(security.csrf, false),
    ipRestriction: security.ipRestriction ?? false,
    timing: toggle<TimingOptions>(observability.timing, false),
    requestId: requestId && {
      header: requestId.header ?? "X-Request-Id",
      generate: requestId.generate ?? (() => crypto.randomUUID()),
    },
    logs,
    logger: observability.logger ?? defaultLogSink(env),
    shutdown: shutdown && {
      timeout: shutdown.timeout ?? 10_000,
      signals: shutdown.signals ?? ["SIGTERM", "SIGINT"],
    },
    body: body && {
      limit: body.limit ?? "100kb",
      json: body.json ?? true,
      urlencoded: body.urlencoded ?? true,
    },
    query: options.query ?? "simple",
    trustProxy: options.trustProxy ?? false,
    health: health && { path: health.path ?? "/health", check: health.check },
    static: resolveStatic(options.static, root),
    views: resolveViews(options.views, root),
    port: options.port ?? 3000,
    etag: options.etag ?? "weak",
    prettyJson: options.json?.pretty ?? false,
    trailingSlash: options.trailingSlash ?? false,
    redirects: new Map(
      Object.entries(options.redirects ?? {}).map(([from, target]) => [
        from,
        typeof target === "string" ? { to: target, status: 302 } : { to: target.to, status: target.status ?? 302 },
      ])
    ),
    notFound: options.notFound,
    onError: options.onError,
  };
}

function resolveStatic(value: KaelumOptions["static"], root: string): ResolvedOptions["static"] {
  if (!value) return false;
  const { dir, prefix = "/", ...rest } = typeof value === "string" ? { dir: value } : value;
  return { ...rest, dir: path.resolve(root, dir), prefix };
}

function resolveViews(value: KaelumOptions["views"], root: string): ResolvedOptions["views"] {
  if (!value) return false;
  const { engine = "ejs", dir = "views" } = value === true ? {} : value;
  return { engine, dir: path.resolve(root, dir) };
}
