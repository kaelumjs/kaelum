import { Express, RequestHandler, ErrorRequestHandler } from "express";
import { Server } from "http";

interface KaelumConfig {
  cors?: boolean | object;
  helmet?: boolean | object;
  static?: string | false;
  logs?: string | boolean;
  bodyParser?: boolean;
  port?: number;
  views?: { engine?: string; path?: string };
  logger?: boolean | false;
  gracefulShutdown?: boolean | GracefulShutdownConfig;
  rateLimit?: boolean | RateLimitConfig;
}

interface HealthOptions {
  path?: string;
  method?: string;
  replace?: boolean;
  readinessCheck?: (req?: any) => Promise<{ ok: boolean; details?: object }> | { ok: boolean; details?: object };
  include?: {
    uptime?: boolean;
    pid?: boolean;
    env?: boolean;
    timestamp?: boolean;
    metrics?: boolean;
  };
}

interface ErrorHandlerOptions {
  exposeStack?: boolean;
  logger?: ((err: Error, req: any, info?: object) => void) | false;
  onError?: (err: Error, req: any, res: any) => void;
}

interface GracefulShutdownConfig {
  /** Timeout in milliseconds before forcing shutdown (default: 10000) */
  timeout?: number;
  /** Process signals to handle (default: ["SIGTERM", "SIGINT"]) */
  signals?: string[];
}

interface RateLimitConfig {
  /** Window duration in ms (default: 900000 = 15 min) */
  windowMs?: number;
  /** Max requests per window per key (default: 100) */
  max?: number;
  /** Response body when rate limited */
  message?: string | object;
  /** HTTP status when rate limited (default: 429) */
  statusCode?: number;
  /** Custom key generator (default: req.ip) */
  keyGenerator?: (req: any) => string;
  /** Skip rate limiting for certain requests */
  skip?: (req: any) => boolean;
  /** Send standard rate-limit headers (default: true) */
  headers?: boolean;
  /** Custom store (must implement increment, resetKey, shutdown) */
  store?: {
    increment(key: string): { totalHits: number; resetTime: number };
    resetKey(key: string): void;
    shutdown(): void;
  };
}

interface RedirectEntry {
  path: string;
  to: string;
  status: number;
}

interface MiddlewareEntry {
  path: string | null;
  handler: RequestHandler;
}

interface RouteHandlers {
  get?: RequestHandler | RequestHandler[];
  post?: RequestHandler | RequestHandler[];
  put?: RequestHandler | RequestHandler[];
  delete?: RequestHandler | RequestHandler[];
  patch?: RequestHandler | RequestHandler[];
  all?: RequestHandler | RequestHandler[];
  [subpath: string]: any;
}

/** Plugin function signature */
type KaelumPlugin = (app: KaelumApp, options?: Record<string, any>) => void;

interface KaelumApp extends Express {
  /** Configure Kaelum features (cors, helmet, static, logs, etc.) */
  setConfig(options: KaelumConfig): KaelumConfig;

  /** Get the current Kaelum configuration */
  getKaelumConfig(): KaelumConfig;

  /** Start the HTTP server */
  start(port?: number, cb?: () => void): Server;

  /** Register routes with a flexible handler object */
  addRoute(path: string, handlers: RouteHandlers | RequestHandler | RequestHandler[]): void;

  /** Register RESTful API routes for a resource */
  apiRoute(resource: string, handlers: RouteHandlers): void;

  /** Register middleware (optionally scoped to a path) */
  setMiddleware(middleware: RequestHandler | RequestHandler[]): MiddlewareEntry[];
  setMiddleware(path: string, middleware: RequestHandler | RequestHandler[]): MiddlewareEntry[];

  /** Register a health check endpoint */
  healthCheck(path?: string): KaelumApp;
  healthCheck(options?: HealthOptions): KaelumApp;

  /** Register redirect route(s) */
  redirect(from: string, to: string, status?: number): RedirectEntry[] | null;
  redirect(map: Record<string, string>): RedirectEntry[] | null;
  redirect(entries: Array<{ from: string; to: string; status?: number }>): RedirectEntry[] | null;

  /** Attach the default Kaelum error handler */
  useErrorHandler(options?: ErrorHandlerOptions): KaelumApp;

  /** Alias for useErrorHandler */
  errorHandler(options?: ErrorHandlerOptions): KaelumApp;

  /** Set or get the static files directory */
  static(dir?: string): KaelumConfig | null;

  /** Remove static file serving */
  removeStatic(): KaelumConfig;

  /** Register a plugin */
  plugin(fn: KaelumPlugin, options?: Record<string, any>): KaelumApp;

  /** List registered plugin names */
  getPlugins(): string[];

  /** Gracefully close the server and run cleanup hooks */
  close(): Promise<void>;
  close(cb: (err?: Error | null) => void): KaelumApp;

  /** Register a cleanup function to run during graceful shutdown */
  onShutdown(fn: () => void | Promise<void>): KaelumApp;
}

/**
 * Create a new Kaelum application instance.
 * Kaelum wraps Express with opinionated defaults and helper methods.
 */
declare function createApp(): KaelumApp;

export = createApp;
