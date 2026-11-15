import request from "supertest";
import { resolveOptions } from "../src/config.js";
import { createKaelum } from "../src/index.js";

describe("configuration", () => {
  describe("defaults (no options)", () => {
    const app = createKaelum();
    app.route("/echo", { post: (c) => ({ id: c.id ?? null, body: c.body, query: c.query }) });

    test("security headers are on", async () => {
      const res = await request(app.express).post("/echo").send({});

      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
      expect(res.headers["content-security-policy"]).toBeDefined();
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });

    test("CORS is off", async () => {
      const res = await request(app.express).post("/echo").set("Origin", "https://other.example").send({});
      expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });

    test("every response has a request ID, also available as c.id", async () => {
      const res = await request(app.express).post("/echo").send({});

      expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
      expect(res.body.id).toBe(res.headers["x-request-id"]);
    });

    test("an incoming request ID is reused when it is safe, replaced when it is not", async () => {
      const kept = await request(app.express).post("/echo").set("X-Request-Id", "trace-abc.123").send({});
      expect(kept.headers["x-request-id"]).toBe("trace-abc.123");

      const replaced = await request(app.express).post("/echo").set("X-Request-Id", "bad id <script>").send({});
      expect(replaced.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    });

    test("error responses carry the request ID too", async () => {
      const res = await request(app.express).get("/nowhere");
      expect(res.status).toBe(404);
      expect(res.headers["x-request-id"]).toBeDefined();
    });

    test("JSON and form bodies are parsed", async () => {
      const json = await request(app.express).post("/echo").send({ a: 1 });
      expect(json.body.body).toEqual({ a: 1 });

      const form = await request(app.express).post("/echo").type("form").send("a=1&b=two");
      expect(form.body.body).toEqual({ a: "1", b: "two" });
    });

    test("bodies over 100kb are rejected with 413", async () => {
      const res = await request(app.express)
        .post("/echo")
        .send({ blob: "x".repeat(110 * 1024) });

      expect(res.status).toBe(413);
      expect(res.body.error.code).toBe("ERROR");
    });

    test("query strings are parsed flat", async () => {
      const res = await request(app.express).post("/echo?filter[tag]=x&page=2").send({});
      expect(res.body.query).toEqual({ "filter[tag]": "x", page: "2" });
    });

    test("GET /health answers ok and is a listed route", async () => {
      const res = await request(app.express).get("/health");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
      expect(app.routes()).toContainEqual({ method: "GET", path: "/health" });
    });
  });

  describe("security", () => {
    test("helmet can be turned off or configured", async () => {
      const off = createKaelum({ security: { helmet: false } });
      off.route("/", { get: () => "x" });
      expect((await request(off.express).get("/")).headers["x-content-type-options"]).toBeUndefined();

      const custom = createKaelum({ security: { helmet: { frameguard: { action: "deny" } } } });
      custom.route("/", { get: () => "x" });
      expect((await request(custom.express).get("/")).headers["x-frame-options"]).toBe("DENY");
    });

    test("cors: true allows any origin", async () => {
      const app = createKaelum({ security: { cors: true } });
      app.route("/", { get: () => "x" });

      const res = await request(app.express).get("/").set("Origin", "https://other.example");
      expect(res.headers["access-control-allow-origin"]).toBe("*");
    });

    test("cors options restrict the origin and answer preflights", async () => {
      const app = createKaelum({
        security: { cors: { origin: ["https://app.example"], credentials: true, methods: ["GET", "POST"] } },
      });
      app.route("/items", { post: (c) => c.created() });

      const allowed = await request(app.express)
        .options("/items")
        .set("Origin", "https://app.example")
        .set("Access-Control-Request-Method", "POST");
      expect(allowed.status).toBe(204);
      expect(allowed.headers["access-control-allow-origin"]).toBe("https://app.example");
      expect(allowed.headers["access-control-allow-credentials"]).toBe("true");
      expect(allowed.headers["access-control-allow-methods"]).toBe("GET,POST");

      const denied = await request(app.express).post("/items").set("Origin", "https://evil.example");
      expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });

  describe("observability", () => {
    test("request IDs can be turned off or customized", async () => {
      const off = createKaelum({ observability: { requestId: false } });
      off.route("/", { get: (c) => ({ id: c.id ?? null }) });
      const offRes = await request(off.express).get("/");
      expect(offRes.headers["x-request-id"]).toBeUndefined();
      expect(offRes.body.id).toBeNull();

      const custom = createKaelum({
        observability: { requestId: { header: "X-Trace-Id", generate: () => "fixed-id" } },
      });
      custom.route("/", { get: (c) => ({ id: c.id }) });
      const customRes = await request(custom.express).get("/");
      expect(customRes.headers["x-trace-id"]).toBe("fixed-id");
      expect(customRes.body.id).toBe("fixed-id");
    });

    test("logs write one line per request when enabled", async () => {
      const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
      const app = createKaelum({ observability: { logs: "tiny" } });
      app.route("/logged", { get: () => "x" });

      await request(app.express).get("/logged");

      const lines = write.mock.calls.map((call) => String(call[0]));
      write.mockRestore();
      expect(lines.some((line) => /^GET \/logged 200 /.test(line))).toBe(true);
    });

    test("log defaults depend on NODE_ENV", () => {
      expect(resolveOptions({}, "test").logs).toBe(false);
      expect(resolveOptions({}, "development").logs).toBe("dev");
      expect(resolveOptions({}, "").logs).toBe("dev"); // NODE_ENV not set
      expect(resolveOptions({}, "production").logs).toBe("tiny");
      expect(resolveOptions({ observability: { logs: true } }, "test").logs).toBe("dev");
      expect(resolveOptions({ observability: { logs: true } }, "production").logs).toBe("tiny");
      expect(resolveOptions({ observability: { logs: false } }, "production").logs).toBe(false);
    });
  });

  describe("body", () => {
    test("limit is configurable", async () => {
      const app = createKaelum({ body: { limit: "1kb" } });
      app.route("/", { post: (c) => c.body });

      expect((await request(app.express).post("/").send({ blob: "x".repeat(2048) })).status).toBe(413);
      expect((await request(app.express).post("/").send({ ok: true })).body).toEqual({ ok: true });
    });

    test("body: false disables parsing", async () => {
      const app = createKaelum({ body: false });
      app.route("/", { post: (c) => ({ body: c.body ?? null }) });

      expect((await request(app.express).post("/").send({ a: 1 })).body).toEqual({ body: null });
    });

    test("parsers can be disabled one by one", async () => {
      const app = createKaelum({ body: { urlencoded: false } });
      app.route("/", { post: (c) => ({ body: c.body ?? null }) });

      expect((await request(app.express).post("/").send({ a: 1 })).body).toEqual({ body: { a: 1 } });
      expect((await request(app.express).post("/").type("form").send("a=1")).body).toEqual({ body: null });
    });
  });

  describe("query and trustProxy", () => {
    test('query: "extended" parses nested keys', async () => {
      const app = createKaelum({ query: "extended" });
      app.route("/", { get: (c) => c.query });

      expect((await request(app.express).get("/?filter[tag]=x&ids[]=1&ids[]=2")).body).toEqual({
        filter: { tag: "x" },
        ids: ["1", "2"],
      });
    });

    test("trustProxy makes the client address come from X-Forwarded-For", async () => {
      const route = { get: (c: { req: { raw: { ip?: string } } }) => ({ ip: c.req.raw.ip }) };

      const direct = createKaelum();
      direct.route("/", route);
      const untrusted = await request(direct.express).get("/").set("X-Forwarded-For", "203.0.113.9");
      expect(untrusted.body.ip).not.toBe("203.0.113.9");

      const proxied = createKaelum({ trustProxy: true });
      proxied.route("/", route);
      const trusted = await request(proxied.express).get("/").set("X-Forwarded-For", "203.0.113.9");
      expect(trusted.body.ip).toBe("203.0.113.9");
    });
  });

  describe("health", () => {
    test("can be disabled or moved", async () => {
      const off = createKaelum({ health: false });
      expect((await request(off.express).get("/health")).status).toBe(404);
      expect(off.routes()).toEqual([]);

      const moved = createKaelum({ health: "/status" });
      expect((await request(moved.express).get("/status")).body).toEqual({ status: "ok" });
      expect((await request(moved.express).get("/health")).status).toBe(404);
    });

    test("a failing check answers 503 without leaking the reason", async () => {
      let healthy = true;
      const app = createKaelum({
        health: {
          check: async () => {
            if (!healthy) throw new Error("db down at 10.0.0.5");
          },
        },
      });

      expect((await request(app.express).get("/health")).status).toBe(200);

      healthy = false;
      const res = await request(app.express).get("/health");
      expect(res.status).toBe(503);
      expect(res.body).toEqual({ error: { code: "SERVICE_UNAVAILABLE", message: "Health check failed" } });
    });

    test("a check returning false answers 503", async () => {
      const app = createKaelum({ health: { path: "/ready", check: () => false } });
      expect((await request(app.express).get("/ready")).status).toBe(503);
    });

    test("a user route on the health path is rejected instead of silently shadowed", () => {
      const app = createKaelum();
      expect(() => app.route("/health", { get: () => "mine" })).toThrow(/GET \/health is already registered/);
    });
  });
});
