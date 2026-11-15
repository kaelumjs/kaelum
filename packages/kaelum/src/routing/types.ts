import type { RequestHandler } from "express";
import type { Context } from "../context.js";
import type { StandardSchemaV1 } from "../schema/standard.js";

export const METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

/** HTTP methods accepted as keys of a route tree. */
export type Method = (typeof METHODS)[number];

/** Any Express middleware. Runs before the handler, in order. */
export type Middleware = RequestHandler;

type Simplify<T> = { [K in keyof T]: T[K] } & {};

type ParamNames<P extends string> = P extends `${string}:${infer Name}/${infer Rest}`
  ? Name | ParamNames<`/${Rest}`>
  : P extends `${string}:${infer Name}`
    ? Name
    : never;

/**
 * Path params of a route path: `ParamsOf<"/users/:id">` is `{ id: string }`.
 * A path that is not known at compile time gives `Record<string, string>`.
 */
export type ParamsOf<P extends string> = string extends P
  ? Record<string, string>
  : Simplify<{ [K in ParamNames<P>]: string }>;

/** A route handler. Return a value to send it, or use the `c.*` helpers. */
export type Handler<P extends string = string> = (c: Context<P>) => unknown;

type SchemaOf<E, Key extends string> = E extends { [K in Key]: infer S } ? S : undefined;

// Tuple-wrapped so a missing schema (`undefined`) picks the fallback instead of distributing.
type OutputOf<S, Fallback> = [S] extends [StandardSchemaV1<unknown, infer Output>] ? Output : Fallback;

/**
 * An endpoint written as an object, for when it validates its input or needs
 * its own middleware. Schemas can come from any Standard Schema library.
 *
 * @typeParam E - the object literal itself; the schemas found in it type `c`
 */
export interface EndpointObject<P extends string = string, E = unknown> {
  /** Validates the request body. Its output becomes `c.body`. */
  body?: StandardSchemaV1;
  /** Validates the query string. Its output becomes `c.query`. */
  query?: StandardSchemaV1;
  /** Validates the path params. Its output becomes `c.params`. */
  params?: StandardSchemaV1;
  /** Express middleware that runs only for this endpoint, after the tree's `use`. */
  use?: Middleware[];
  handler: (
    c: Context<
      P,
      OutputOf<SchemaOf<E, "body">, unknown>,
      OutputOf<SchemaOf<E, "query">, Context<P>["query"]>,
      OutputOf<SchemaOf<E, "params">, ParamsOf<P>>
    >
  ) => unknown;
}

/**
 * The value of a method key: a handler function or an endpoint object.
 *
 * While the tree's type is still being inferred, a handler written as a bare
 * function shows up here as `unknown`. "Function" therefore has to be the
 * fallback branch; testing for a function first breaks inference of `c` for
 * every plain handler.
 */
type Endpoint<E, P extends string> = E extends { handler: unknown }
  ? EndpointObject<P, E>
  : E extends object
    ? E extends (...args: never[]) => unknown
      ? Handler<P>
      : EndpointObject<P, E>
    : Handler<P>;

type UnknownKey<K> = K extends string
  ? `Unknown key "${K}": expected an HTTP method, "use" or a sub-path starting with "/"`
  : never;

// A sub-path whose value is a handler instead of a tree is not rejected here:
// any conditional on `V` at this point defers while `T` is being inferred and
// costs every nested handler its `c` type. That mistake is caught at runtime.
type Shape<V, K, P extends string> = K extends `/${string}`
  ? RouteTree<V, `${P}${K}`>
  : K extends Method
    ? Endpoint<V, P>
    : K extends "use"
      ? Middleware[]
      : UnknownKey<K>;

/**
 * A tree of routes rooted at path `P`.
 *
 * - a method key (`get`, `post`, ...) is an endpoint;
 * - a key starting with `/` is a nested tree, and its path is appended;
 * - `use` is middleware for this level and everything below it.
 *
 * `T[K]` appears bare in the template so `T` is inferred straight from the
 * object literal; the intersection with `Shape` is what gives `c` its type.
 */
export type RouteTree<T, P extends string> = { [K in keyof T]: T[K] & Shape<T[K], K, P> };

/** A route tree bound to its full path, created by `defineRoutes`. */
export interface DefinedRoutes<P extends string = string> {
  readonly path: P;
  readonly tree: Record<string, unknown>;
}

/** One registered endpoint, as listed by `app.routes()`. */
export interface RouteInfo {
  method: Uppercase<Method>;
  path: string;
}
