import express from "express";
import request from "supertest";
import { kaelum, HttpError, Kaelum } from "../src/index.js";

describe("Kaelum app", () => {
  let app: Kaelum;

  beforeEach(() => {
    app = kaelum({ health: false });
  });

  describe("route tree", () => {
    test("registers methods, nested paths and params", async () => {
      app.route("/users", {
        get: () => [{ id: "1" }],
        post: (c) => c.created(c.body),
        "/:id": {
          get: (c) => ({ id: c.params.id }),
          "/posts/:postId": {
            get: (c) => ({ user: c.params.id, post: c.params.postId }),
          },
        },
      });

      const list = await request(app.express).get("/users");
      expect(list.status).toBe(200);
      expect(list.body).toEqual([{ id: "1" }]);

      const created = await request(app.express).post("/users").send({ name: "Ada" });
      expect(created.status).toBe(201);
      expect(created.body).toEqual({ name: "Ada" });

      const one = await request(app.express).get("/users/42");
      expect(one.body).toEqual({ id: "42" });

      const nested = await request(app.express).get("/users/42/posts/7");
      expect(nested.body).toEqual({ user: "42", post: "7" });
    });

    test("lists registered routes", () => {
      app.route("/users", {
        get: () => [],
        "/:id": { delete: (c) => c.noContent() },
      });

      expect(app.routes()).toEqual([
        { method: "GET", path: "/users" },
        { method: "DELETE", path: "/users/:id" },
      ]);
    });

    test("normalizes slashes when joining paths", () => {
      app.route("/api/", { "/users/": { get: () => [] } });
      app.route("health", { get: () => "ok" });

      expect(app.routes().map((r) => r.path)).toEqual(["/api/users", "/health"]);
    });

    test("routes in their own module: a function that receives the app", async () => {
      const userRoutes = (target: Kaelum) =>
        target.route("/orgs/:orgId/users", {
          get: (c) => ({ org: c.params.orgId }),
        });

      userRoutes(app);

      const res = await request(app.express).get("/orgs/acme/users");
      expect(res.body).toEqual({ org: "acme" });
    });

    test("lets methods be added to the same path in separate calls", async () => {
      app.route("/items", { get: () => ["a"] });
      app.route("/items", { post: (c) => c.created() });

      expect((await request(app.express).get("/items")).status).toBe(200);
      expect((await request(app.express).post("/items")).status).toBe(201);
    });
  });

  describe("invalid trees", () => {
    const invalid = (tree: unknown) => () => app.route("/x", tree as never);

    test("unknown key", () => {
      expect(invalid({ gett: () => 1 })).toThrow(/unknown key "gett"/);
    });

    test("endpoint object without a handler", () => {
      expect(invalid({ post: { use: [] } })).toThrow(/POST \/x: endpoint object needs a "handler"/);
    });

    test("endpoint that is neither a function nor an object", () => {
      expect(invalid({ get: "nope" })).toThrow(/GET \/x: expected a handler function/);
    });

    test("use that is not an array of functions", () => {
      expect(invalid({ use: () => {} })).toThrow(/"use" must be an array/);
      expect(invalid({ "/a": { use: ["x"] } })).toThrow(/route \/x\/a: "use" must be an array/);
    });

    test("duplicate method and path", () => {
      app.route("/dup", { get: () => 1 });
      expect(() => app.route("/dup", { get: () => 2 })).toThrow(/GET \/dup is already registered/);
    });

    test("registers nothing when any part of the tree is invalid", () => {
      expect(() =>
        app.route("/partial", { get: () => 1, "/deep": { nope: () => 2 } } as never)
      ).toThrow();
      expect(app.routes()).toEqual([]);
    });
  });

  describe("middleware", () => {
    const tag =
      (name: string): express.RequestHandler =>
      (req, _res, next) => {
        const seen = ((req as { seen?: string[] }).seen ??= []);
        seen.push(name);
        next();
      };
    const seen = (c: { req: { raw: unknown } }) => (c.req.raw as { seen?: string[] }).seen ?? [];

    test("use applies to its level and below, outermost first, then the endpoint's own", async () => {
      app.route("/a", {
        use: [tag("a")],
        get: (c) => seen(c),
        "/b": {
          use: [tag("b")],
          get: { use: [tag("endpoint")], handler: (c) => seen(c) },
        },
      });
      app.route("/outside", { get: (c) => seen(c) });

      expect((await request(app.express).get("/a")).body).toEqual(["a"]);
      expect((await request(app.express).get("/a/b")).body).toEqual(["a", "b", "endpoint"]);
      expect((await request(app.express).get("/outside")).body).toEqual([]);
    });

    test("middleware can end the request", async () => {
      app.route("/private", {
        use: [(_req, res) => void res.status(401).json({ blocked: true })],
        get: () => "secret",
      });

      const res = await request(app.express).get("/private");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ blocked: true });
    });

    test("middleware errors, thrown or async, reach the error handler", async () => {
      app.route("/sync", {
        use: [
          () => {
            throw new HttpError(403, "nope");
          },
        ],
        get: () => "x",
      });
      app.route("/async", {
        use: [async () => Promise.reject(new HttpError(409, "busy"))],
        get: () => "x",
      });

      expect((await request(app.express).get("/sync")).status).toBe(403);
      expect((await request(app.express).get("/async")).status).toBe(409);
    });

    test("app.use adds Express middleware, with or without a path", async () => {
      app.use(tag("global"));
      app.use("/scoped", tag("scoped"));
      app.route("/scoped", { get: (c) => seen(c) });
      app.route("/other", { get: (c) => seen(c) });

      expect((await request(app.express).get("/scoped")).body).toEqual(["global", "scoped"]);
      expect((await request(app.express).get("/other")).body).toEqual(["global"]);
    });
  });

  describe("handler results", () => {
    test("objects and arrays become JSON, strings become text", async () => {
      app.route("/r", {
        "/object": { get: () => ({ a: 1 }) },
        "/string": { get: () => "hello" },
        "/async": { get: async () => ({ async: true }) },
      });

      const object = await request(app.express).get("/r/object");
      expect(object.headers["content-type"]).toMatch(/application\/json/);
      expect(object.body).toEqual({ a: 1 });

      const string = await request(app.express).get("/r/string");
      expect(string.headers["content-type"]).toMatch(/text\/plain/);
      expect(string.text).toBe("hello");

      expect((await request(app.express).get("/r/async")).body).toEqual({ async: true });
    });

    test("returning nothing sends 204", async () => {
      app.route("/nothing", { get: () => {} });

      const res = await request(app.express).get("/nothing");
      expect(res.status).toBe(204);
      expect(res.text).toBe("");
    });

    test("a response sent through c is not sent twice", async () => {
      app.route("/once", {
        get: (c) => {
          c.json({ first: true });
          return { second: true };
        },
      });

      expect((await request(app.express).get("/once")).body).toEqual({ first: true });
    });
  });

  describe("context", () => {
    test("exposes params, query, body, headers and request details", async () => {
      app.route("/echo/:id", {
        post: (c) => ({
          params: c.params,
          query: c.query,
          body: c.body,
          agent: c.headers["x-agent"],
          viaHelper: c.req.header("X-Agent"),
          method: c.req.method,
          path: c.req.path,
          url: c.req.url,
        }),
      });

      const res = await request(app.express)
        .post("/echo/9?page=2")
        .set("X-Agent", "test")
        .send({ name: "Ada" });

      expect(res.body).toEqual({
        params: { id: "9" },
        query: { page: "2" },
        body: { name: "Ada" },
        agent: "test",
        viaHelper: "test",
        method: "POST",
        path: "/echo/9",
        url: "/echo/9?page=2",
      });
    });

    test("response helpers set status and body", async () => {
      app.route("/h", {
        "/ok": { get: (c) => c.ok({ ok: true }) },
        "/created": { get: (c) => c.created({ id: 1 }) },
        "/no-content": { get: (c) => c.noContent() },
        "/text": { get: (c) => c.text("plain", 202) },
        "/html": { get: (c) => c.html("<p>hi</p>") },
        "/redirect": { get: (c) => c.redirect("/elsewhere", 301) },
        "/header": { get: (c) => (c.res.header("X-Custom", "1"), c.ok()) },
      });
      const get = (path: string) => request(app.express).get(`/h${path}`);

      expect((await get("/ok")).body).toEqual({ ok: true });
      expect((await get("/created")).status).toBe(201);
      expect((await get("/no-content")).status).toBe(204);

      const text = await get("/text");
      expect(text.status).toBe(202);
      expect(text.text).toBe("plain");

      expect((await get("/html")).headers["content-type"]).toMatch(/text\/html/);

      const redirect = await get("/redirect");
      expect(redirect.status).toBe(301);
      expect(redirect.headers.location).toBe("/elsewhere");

      const header = await get("/header");
      expect(header.status).toBe(200);
      expect(header.headers["x-custom"]).toBe("1");
    });

    test("error helpers send the standard error body", async () => {
      app.route("/e", {
        "/bad": { get: (c) => c.badRequest("Missing name", { field: "name" }) },
        "/missing": { get: (c) => c.notFound() },
        "/teapot": { get: (c) => c.error(418, "Short and stout") },
      });
      const get = (path: string) => request(app.express).get(`/e${path}`);

      const bad = await get("/bad");
      expect(bad.status).toBe(400);
      expect(bad.body).toEqual({
        error: { code: "BAD_REQUEST", message: "Missing name", details: { field: "name" } },
      });

      expect((await get("/missing")).body).toEqual({
        error: { code: "NOT_FOUND", message: "Not Found" },
      });

      const teapot = await get("/teapot");
      expect(teapot.status).toBe(418);
      expect(teapot.body).toEqual({ error: { code: "ERROR", message: "Short and stout" } });
    });

    test("set and get carry values within a request", async () => {
      app.route("/vars", {
        get: (c) => {
          c.set("user", { id: 1 });
          return { user: c.get("user"), missing: c.get("nope") ?? null };
        },
      });

      expect((await request(app.express).get("/vars")).body).toEqual({
        user: { id: 1 },
        missing: null,
      });
    });
  });

  describe("errors and fallbacks", () => {
    test("HttpError thrown from a handler, sync or async", async () => {
      app.route("/t", {
        "/sync": {
          get: () => {
            throw new HttpError(404, "User not found", { code: "USER_NOT_FOUND" });
          },
        },
        "/async": {
          get: async () => {
            throw new HttpError(422, "Invalid", { details: [{ field: "x" }] });
          },
        },
      });

      const sync = await request(app.express).get("/t/sync");
      expect(sync.status).toBe(404);
      expect(sync.body).toEqual({ error: { code: "USER_NOT_FOUND", message: "User not found" } });

      const async = await request(app.express).get("/t/async");
      expect(async.status).toBe(422);
      expect(async.body.error.details).toEqual([{ field: "x" }]);
    });

    test("unexpected errors become 500 without leaking the message", async () => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      app.route("/boom", {
        get: () => {
          throw new Error("database password is hunter2");
        },
      });

      const res = await request(app.express).get("/boom");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
      expect(log).toHaveBeenCalledOnce();
      log.mockRestore();
    });

    test("malformed JSON body is a 400", async () => {
      app.route("/json", { post: (c) => c.body });

      const res = await request(app.express)
        .post("/json")
        .set("Content-Type", "application/json")
        .send("{ nope");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    test("unknown path is a JSON 404", async () => {
      const res = await request(app.express).get("/nowhere");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: { code: "NOT_FOUND", message: "Not Found" } });
    });

    test("known path with the wrong method is a 405 with Allow", async () => {
      app.route("/things", { get: () => [], post: (c) => c.created() });

      const res = await request(app.express).delete("/things");

      expect(res.status).toBe(405);
      expect(res.headers.allow).toBe("GET, POST, HEAD, OPTIONS");
      expect(res.body.error.code).toBe("METHOD_NOT_ALLOWED");
      expect(res.body.error.details).toEqual({ allow: ["GET", "POST", "HEAD", "OPTIONS"] });
    });

    test("HEAD falls back to GET, OPTIONS answers with Allow", async () => {
      app.route("/things", { get: () => ({ a: 1 }) });

      const head = await request(app.express).head("/things");
      expect(head.status).toBe(200);
      expect(head.text ?? "").toBe("");

      const options = await request(app.express).options("/things");
      expect(options.status).toBe(204);
      expect(options.headers.allow).toBe("GET, HEAD, OPTIONS");
    });

    test("routes added after a request still come before the 404", async () => {
      expect((await request(app.express).get("/late")).status).toBe(404);

      app.route("/late", { get: () => "now" });

      expect((await request(app.express).get("/late")).text).toBe("now");
    });
  });

  describe("embedding and lifecycle", () => {
    test("app.handler mounts inside an existing Express app", async () => {
      app.route("/users/:id", { get: (c) => ({ id: c.params.id }) });

      const legacy = express();
      legacy.get("/old", (_req, res) => res.send("old"));
      legacy.use("/v2", app.handler);

      expect((await request(legacy).get("/old")).text).toBe("old");
      expect((await request(legacy).get("/v2/users/5")).body).toEqual({ id: "5" });
    });

    test("does not send x-powered-by", async () => {
      app.route("/", { get: () => "hi" });
      expect((await request(app.express).get("/")).headers["x-powered-by"]).toBeUndefined();
    });

    test("start and close", async () => {
      app.route("/ping", { get: () => "pong" });

      const server = await app.start(0);
      const { port } = server.address() as { port: number };

      const res = await fetch(`http://127.0.0.1:${port}/ping`);
      expect(await res.text()).toBe("pong");

      await expect(app.start(0)).rejects.toThrow(/already started/);

      await app.close();
      expect(server.listening).toBe(false);
      await expect(app.close()).resolves.toBeUndefined();
    });
  });
});
