import createApp from "./createApp.js";
import type { KaelumApp } from "./types.js";

/** Create a Kaelum app: an Express app with Kaelum helpers attached. */
const kaelum = createApp as () => KaelumApp;

export default kaelum;

// Lets CommonJS callers keep writing `require("kaelum")()`.
export { kaelum as "module.exports" };

export type * from "./types.js";

// --- 2.0 API (in progress) --------------------------------------------------
// Lives next to the 1.x factory above until it replaces it as the default export.
export { Kaelum, createKaelum, defineRoutes } from "./app.js";
export { Context } from "./context.js";
export type { ContextRequest, ContextResponse, Responded } from "./context.js";
export { HttpError } from "./http-error.js";
export type { ErrorBody, HttpErrorOptions } from "./http-error.js";
export { k } from "./schema/k.js";
export type { Infer, KSchema } from "./schema/k.js";
export type { InferOutput, StandardSchemaV1 } from "./schema/standard.js";
export type { ValidationIssue, ValidationSource } from "./schema/validate.js";
export type {
  DefinedRoutes,
  EndpointObject,
  Handler,
  Method,
  Middleware,
  ParamsOf,
  RouteInfo,
  RouteTree,
} from "./routing/types.js";
