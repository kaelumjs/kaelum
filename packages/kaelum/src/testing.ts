// Entry point for `kaelum/testing`
import { createServer, type RequestListener, type Server } from "node:http";
import type { AddressInfo } from "node:net";

export interface TestRequestOptions {
  headers?: Record<string, string>;
  /** Appended to the path as a query string. */
  query?: Record<string, string | number | boolean>;
  /** A string is sent as is; anything else is sent as JSON. */
  body?: unknown;
}

export interface TestResponse {
  status: number;
  headers: Headers;
  /** The parsed JSON for a JSON response, the text otherwise, `undefined` when empty. */
  // `any` on purpose: tests assert on it freely.
  body: any;
  /** The raw response body. */
  text: string;
}

type BodylessCall = (path: string, options?: Omit<TestRequestOptions, "body">) => Promise<TestResponse>;
type BodyCall = (path: string, body?: unknown, options?: Omit<TestRequestOptions, "body">) => Promise<TestResponse>;

export interface TestClient {
  request(method: string, path: string, options?: TestRequestOptions): Promise<TestResponse>;
  get: BodylessCall;
  head: BodylessCall;
  delete: BodylessCall;
  post: BodyCall;
  put: BodyCall;
  patch: BodyCall;
  /** Stop the test server. Call it when the tests are done. */
  close(): Promise<void>;
}

/**
 * Make requests to an app in tests, without calling `app.start()`.
 *
 * The app is served on a random local port, opened on the first request.
 * Redirects are not followed, so they can be asserted on.
 *
 * @example
 * const client = testApp(app);
 * const res = await client.post("/users", { name: "Ada" });
 * expect(res.status).toBe(201);
 * await client.close();
 */
export function testApp(app: { handler: unknown }): TestClient {
  let server: Server | undefined;
  let origin: Promise<string> | undefined;

  const listen = (): Promise<string> =>
    (origin ??= new Promise((resolve, reject) => {
      server = createServer(app.handler as RequestListener);
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        resolve(`http://127.0.0.1:${(server?.address() as AddressInfo).port}`);
      });
    }));

  const request: TestClient["request"] = async (method, path, options = {}) => {
    const url = new URL(path, await listen());
    for (const [key, value] of Object.entries(options.query ?? {})) url.searchParams.set(key, String(value));

    const headers = new Headers(options.headers);
    let body: string | undefined;
    if (typeof options.body === "string") {
      body = options.body;
    } else if (options.body !== undefined) {
      body = JSON.stringify(options.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }

    const res = await fetch(url, { method: method.toUpperCase(), headers, body, redirect: "manual" });
    const text = await res.text();
    const isJson = /\bjson\b/i.test(res.headers.get("content-type") ?? "");

    return {
      status: res.status,
      headers: res.headers,
      body: text === "" ? undefined : isJson ? JSON.parse(text) : text,
      text,
    };
  };

  const bodyless =
    (method: string): BodylessCall =>
    (path, options) =>
      request(method, path, options);
  const withBody =
    (method: string): BodyCall =>
    (path, body, options) =>
      request(method, path, { ...options, body });

  return {
    request,
    get: bodyless("GET"),
    head: bodyless("HEAD"),
    delete: bodyless("DELETE"),
    post: withBody("POST"),
    put: withBody("PUT"),
    patch: withBody("PATCH"),
    close() {
      const current = server;
      server = undefined;
      origin = undefined;
      if (!current) return Promise.resolve();

      return new Promise((resolve) => {
        current.close(() => resolve());
        // fetch keeps connections alive; without this, close would wait for them to time out.
        current.closeAllConnections();
      });
    },
  };
}
