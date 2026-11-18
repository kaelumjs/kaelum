import type { HelmetOptions } from "helmet";
import type { CsrfOptions } from "./middleware/csrf.js";
import type { IpRestrictionOptions } from "./middleware/ip-restriction.js";
import type { RateLimitOptions } from "./middleware/rate-limit.js";
import type { RequestLogFormat } from "./middleware/request-logger.js";
import type { TimingOptions } from "./middleware/timing.js";
import { defaultLogSink, type LogSink } from "./logger.js";

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

export function resolveOptions(options: KaelumOptions = {}, env = process.env.NODE_ENV): ResolvedOptions {
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
  };
}
