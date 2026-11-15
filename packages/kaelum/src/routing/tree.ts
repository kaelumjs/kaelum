import { METHODS, type Handler, type Method, type Middleware } from "./types.js";

/** One endpoint found while walking a route tree. */
export interface FlatRoute {
  method: Method;
  path: string;
  /** Middleware from every enclosing `use`, outermost first, then the endpoint's own. */
  middleware: Middleware[];
  handler: Handler;
}

const METHOD_SET: ReadonlySet<string> = new Set(METHODS);

/** Join a base path and a sub-path key into one normalized path. */
export function joinPaths(base: string, sub: string): string {
  const joined = `${base}/${sub}`.replace(/\/{2,}/g, "/");
  const trimmed = joined.length > 1 ? joined.replace(/\/$/, "") : joined;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * Walk a route tree and return every endpoint in it, in declaration order.
 * Throws a descriptive error for anything that is not a valid tree.
 */
export function flattenTree(path: string, tree: unknown): FlatRoute[] {
  if (typeof path !== "string" || path === "") {
    throw new TypeError("route: path must be a non-empty string");
  }
  const routes: FlatRoute[] = [];
  walk(joinPaths("/", path), tree, [], routes);
  return routes;
}

function walk(path: string, node: unknown, inherited: Middleware[], out: FlatRoute[]): void {
  if (!isPlainObject(node)) {
    throw new TypeError(`route ${path}: expected an object of routes, got ${describe(node)}`);
  }

  const own = node.use === undefined ? [] : toMiddleware(node.use, `route ${path}: "use"`);
  const middleware = [...inherited, ...own];

  for (const [key, value] of Object.entries(node)) {
    if (key === "use") continue;

    if (key.startsWith("/")) {
      walk(joinPaths(path, key), value, middleware, out);
      continue;
    }

    if (METHOD_SET.has(key)) {
      out.push(toRoute(key as Method, path, value, middleware));
      continue;
    }

    throw new TypeError(
      `route ${path}: unknown key "${key}". Expected an HTTP method (${METHODS.join(", ")}), "use" or a sub-path starting with "/"`
    );
  }
}

function toRoute(method: Method, path: string, value: unknown, inherited: Middleware[]): FlatRoute {
  const where = `route ${method.toUpperCase()} ${path}`;

  if (typeof value === "function") {
    return { method, path, middleware: inherited, handler: value as Handler };
  }

  if (isPlainObject(value)) {
    if (typeof value.handler !== "function") {
      throw new TypeError(`${where}: endpoint object needs a "handler" function`);
    }
    const own = value.use === undefined ? [] : toMiddleware(value.use, `${where}: "use"`);
    return { method, path, middleware: [...inherited, ...own], handler: value.handler as Handler };
  }

  throw new TypeError(`${where}: expected a handler function or an endpoint object, got ${describe(value)}`);
}

function toMiddleware(value: unknown, where: string): Middleware[] {
  if (!Array.isArray(value) || value.some((fn) => typeof fn !== "function")) {
    throw new TypeError(`${where} must be an array of middleware functions`);
  }
  return value as Middleware[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
  if (value === null) return "null";
  return Array.isArray(value) ? "an array" : typeof value;
}
