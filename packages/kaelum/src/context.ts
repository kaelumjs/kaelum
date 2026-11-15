import type { Request, Response } from "express";
import { errorBody } from "./http-error.js";
import type { ParamsOf } from "./routing/types.js";

declare const responded: unique symbol;

/**
 * What the `c.*` response helpers return. The response has already been
 * written; returning this from a handler tells Kaelum there is nothing left
 * to send.
 */
export interface Responded {
  readonly [responded]: true;
}

/** @internal */
export const RESPONDED = Object.freeze({}) as Responded;

/**
 * The single argument of every Kaelum handler.
 *
 * @typeParam P - the route path, used to type `c.params`
 */
export class Context<P extends string = string> {
  /** Request helpers, plus the Express request as `c.req.raw`. */
  readonly req: ContextRequest;
  /** Response helpers, plus the Express response as `c.res.raw`. */
  readonly res: ContextResponse;

  #vars = new Map<string, unknown>();

  constructor(req: Request, res: Response) {
    this.req = new ContextRequest(req);
    this.res = new ContextResponse(res);
  }

  /** Path params, typed from the route path. */
  get params(): ParamsOf<P> {
    return this.req.raw.params as ParamsOf<P>;
  }

  /** Parsed query string. */
  get query(): Request["query"] {
    return this.req.raw.query;
  }

  /** Parsed request body, or `undefined` when the request has none. */
  get body(): unknown {
    return this.req.raw.body;
  }

  /** Request headers, with lower-case names. */
  get headers(): Request["headers"] {
    return this.req.raw.headers;
  }

  /** Store a value for later in the same request. */
  set(key: string, value: unknown): this {
    this.#vars.set(key, value);
    return this;
  }

  /** Read a value stored with `c.set()`. */
  get<T = unknown>(key: string): T | undefined {
    return this.#vars.get(key) as T | undefined;
  }

  // --- responses ----------------------------------------------------------

  /** Send JSON. */
  json(data: unknown, status = 200): Responded {
    this.res.raw.status(status).json(data);
    return RESPONDED;
  }

  /** Send plain text. */
  text(text: string, status = 200): Responded {
    this.res.raw.status(status).type("text/plain").send(text);
    return RESPONDED;
  }

  /** Send HTML. */
  html(html: string, status = 200): Responded {
    this.res.raw.status(status).type("text/html").send(html);
    return RESPONDED;
  }

  /** Redirect to another URL. */
  redirect(url: string, status = 302): Responded {
    this.res.raw.redirect(status, url);
    return RESPONDED;
  }

  /** 200 with a JSON body. */
  ok(data?: unknown): Responded {
    return data === undefined ? this.#empty(200) : this.json(data, 200);
  }

  /** 201 with a JSON body. */
  created(data?: unknown): Responded {
    return data === undefined ? this.#empty(201) : this.json(data, 201);
  }

  /** 204 with no body. */
  noContent(): Responded {
    return this.#empty(204);
  }

  /** 400 with the standard error body. */
  badRequest(message?: string, details?: unknown): Responded {
    return this.error(400, message, details);
  }

  /** 401 with the standard error body. */
  unauthorized(message?: string, details?: unknown): Responded {
    return this.error(401, message, details);
  }

  /** 403 with the standard error body. */
  forbidden(message?: string, details?: unknown): Responded {
    return this.error(403, message, details);
  }

  /** 404 with the standard error body. */
  notFound(message?: string, details?: unknown): Responded {
    return this.error(404, message, details);
  }

  /** 409 with the standard error body. */
  conflict(message?: string, details?: unknown): Responded {
    return this.error(409, message, details);
  }

  /** Any status with the standard error body: `{ error: { code, message, details? } }`. */
  error(status: number, message?: string, details?: unknown): Responded {
    return this.json(errorBody(status, message, undefined, details), status);
  }

  #empty(status: number): Responded {
    this.res.raw.status(status).end();
    return RESPONDED;
  }
}

/** Read-only view of the request. */
export class ContextRequest {
  constructor(
    /** The Express request. */
    readonly raw: Request
  ) {}

  get method(): string {
    return this.raw.method;
  }

  /** Path without the query string. */
  get path(): string {
    return this.raw.path;
  }

  /** Full URL as received, including the query string. */
  get url(): string {
    return this.raw.originalUrl;
  }

  /** A request header, case-insensitive. */
  header(name: string): string | undefined {
    return this.raw.get(name);
  }
}

/** Helpers to shape the response before it is sent. */
export class ContextResponse {
  constructor(
    /** The Express response. */
    readonly raw: Response
  ) {}

  /** Set a response header. */
  header(name: string, value: string | number | readonly string[]): this {
    this.raw.setHeader(name, value);
    return this;
  }

  /** True once the response has started. */
  get sent(): boolean {
    return this.raw.headersSent;
  }
}
