// Loads .env before anything else in the app runs. See load-env.ts.
import "./load-env.js";
import { kaelum } from "./app.js";

export default kaelum;

export { Kaelum, kaelum } from "./app.js";
export type { CloseHook, Plugin } from "./app.js";
export type {
  BodyOptions,
  CorsOptions,
  CsrfConfig,
  HealthOptions,
  KaelumOptions,
  RedirectTarget,
  RequestIdOptions,
  ShutdownOptions,
  StaticOptions,
  ViewsOptions,
} from "./config.js";
export { Context } from "./context.js";
export type { ContextRequest, ContextResponse, Responded } from "./context.js";
export { HttpError } from "./http-error.js";
export type { ErrorBody, HttpErrorOptions } from "./http-error.js";
export type { LogEntry, LogLevel, LogSink, Logger } from "./logger.js";

// Middleware factories, for `app.use()` or a single route's `use`.
export { ipRestriction } from "./middleware/ip-restriction.js";
export type { IpRestrictionOptions } from "./middleware/ip-restriction.js";
export { rateLimit } from "./middleware/rate-limit.js";
export type { RateLimitOptions, RateLimitStore } from "./middleware/rate-limit.js";
export { serveStatic } from "./middleware/static.js";
export type { ServeStaticOptions } from "./middleware/static.js";
export type { CsrfOptions } from "./middleware/csrf.js";
export type { TimingOptions } from "./middleware/timing.js";

export { k } from "./schema/k.js";
export type { Infer, KSchema } from "./schema/k.js";
export type { InferOutput, StandardSchemaV1 } from "./schema/standard.js";
export type { ValidationIssue, ValidationSource } from "./schema/validate.js";
export type {
  EndpointObject,
  Handler,
  Method,
  Middleware,
  ParamsOf,
  ResourceActions,
  RouteInfo,
  RouteTree,
  SingleEndpoint,
} from "./routing/types.js";
