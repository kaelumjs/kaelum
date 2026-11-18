import request from "supertest";
import { kaelum, ipRestriction, rateLimit } from "../src/index.js";

describe("security and timing options", () => {
  describe("rate limit", () => {
    test("off by default", async () => {
      const app = kaelum();
      app.route("/", { get: () => "x" });

      const res = await request(app.express).get("/");
      expect(res.headers["ratelimit-limit"]).toBeUndefined();
    });

    test("limits the whole app and answers 429 in the standard error shape", async () => {
      const app = kaelum({ security: { rateLimit: { max: 2, windowMs: 60_000 } } });
      app.route("/a", { get: () => "a" });
      app.route("/b", { get: () => "b" });

      const first = await request(app.express).get("/a");
      expect(first.status).toBe(200);
      expect(first.headers["ratelimit-limit"]).toBe("2");
      expect(first.headers["ratelimit-remaining"]).toBe("1");

      expect((await request(app.express).get("/b")).status).toBe(200);

      const limited = await request(app.express).get("/a");
      expect(limited.status).toBe(429);
      expect(limited.headers["retry-after"]).toBeDefined();
      expect(limited.body).toEqual({
        error: { code: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later." },
      });
    });

    test("is checked before the body is parsed", async () => {
      const app = kaelum({ security: { rateLimit: { max: 1 } } });
      app.route("/", { post: (c) => c.body });

      await request(app.express).post("/").send({ ok: true });
      const res = await request(app.express).post("/").set("Content-Type", "application/json").send("{ broken");

      // a malformed body would be a 400; getting 429 shows the limiter ran first
      expect(res.status).toBe(429);
    });

    test("rateLimit() protects a single route through `use`", async () => {
      const app = kaelum();
      app.route("/login", { post: { use: [rateLimit({ max: 1 })], handler: (c) => c.ok({ in: true }) } });
      app.route("/open", { get: () => "x" });

      expect((await request(app.express).post("/login")).status).toBe(200);
      expect((await request(app.express).post("/login")).status).toBe(429);
      expect((await request(app.express).get("/open")).status).toBe(200);
    });
  });

  describe("CSRF", () => {
    test("off by default", async () => {
      const app = kaelum();
      app.route("/", { post: (c) => c.created() });

      expect((await request(app.express).post("/")).status).toBe(201);
    });

    test("csrf: true checks the origin of state-changing requests", async () => {
      const app = kaelum({ security: { csrf: { origin: "https://app.example" } } });
      app.route("/items", { get: () => [], post: (c) => c.created() });

      expect((await request(app.express).get("/items")).status).toBe(200);
      expect((await request(app.express).post("/items").set("Origin", "https://app.example")).status).toBe(201);

      const crossSite = await request(app.express).post("/items").set("Origin", "https://evil.example");
      expect(crossSite.status).toBe(403);
      expect(crossSite.body).toEqual({ error: { code: "CSRF_FAILED", message: "CSRF validation failed" } });

      expect((await request(app.express).post("/items")).status).toBe(403);
    });

    test('strategy: "token" requires the cookie value in the header', async () => {
      const app = kaelum({ security: { csrf: { strategy: "token" } } });
      app.route("/items", { get: () => [], post: (c) => c.created() });

      const first = await request(app.express).get("/items");
      const cookie = first.headers["set-cookie"]?.[0] ?? "";
      const token = /csrf-token=([^;]+)/.exec(cookie)?.[1] ?? "";
      expect(token).not.toBe("");

      expect((await request(app.express).post("/items").set("Cookie", cookie)).status).toBe(403);
      expect(
        (await request(app.express).post("/items").set("Cookie", cookie).set("X-CSRF-Token", "wrong")).status
      ).toBe(403);
      expect(
        (await request(app.express).post("/items").set("Cookie", cookie).set("X-CSRF-Token", token)).status
      ).toBe(201);
    });

    test("excluded paths are not checked", async () => {
      const app = kaelum({ security: { csrf: { origin: "https://app.example", exclude: ["/webhooks/*"] } } });
      app.route("/webhooks/stripe", { post: (c) => c.noContent() });

      expect((await request(app.express).post("/webhooks/stripe")).status).toBe(204);
    });
  });

  describe("IP restriction", () => {
    test("deny blocks, with the standard error shape", async () => {
      const app = kaelum({ security: { ipRestriction: { deny: ["0.0.0.0/0"] } } });
      app.route("/", { get: () => "x" });

      const res = await request(app.express).get("/");
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("IP_NOT_ALLOWED");
    });

    test("allow wins over deny", async () => {
      const app = kaelum({
        security: { ipRestriction: { allow: ["127.0.0.1", "::ffff:127.0.0.1", "::1"], deny: ["0.0.0.0/0"] } },
      });
      app.route("/", { get: () => "x" });

      expect((await request(app.express).get("/")).status).toBe(200);
    });

    test("ipRestriction() protects a single subtree through `use`", async () => {
      const app = kaelum();
      app.route("/admin", { use: [ipRestriction({ deny: ["0.0.0.0/0"] })], get: () => "secret" });
      app.route("/public", { get: () => "x" });

      expect((await request(app.express).get("/admin")).status).toBe(403);
      expect((await request(app.express).get("/public")).status).toBe(200);
    });

    test("blocked clients are rejected before the health check too", async () => {
      const app = kaelum({ security: { ipRestriction: { deny: ["0.0.0.0/0"] } } });
      expect((await request(app.express).get("/health")).status).toBe(403);
    });
  });

  describe("timing", () => {
    test("off by default, Server-Timing header when enabled", async () => {
      const off = kaelum();
      off.route("/", { get: () => "x" });
      expect((await request(off.express).get("/")).headers["server-timing"]).toBeUndefined();

      const on = kaelum({ observability: { timing: true } });
      on.route("/", { get: () => "x" });
      expect((await request(on.express).get("/")).headers["server-timing"]).toMatch(/^total;dur=\d+\.\d{2}$/);
    });

    test("header name and precision are configurable", async () => {
      const app = kaelum({ observability: { timing: { headerName: "X-Time", precision: 0 } } });
      app.route("/", { get: () => "x" });

      expect((await request(app.express).get("/")).headers["x-time"]).toMatch(/^total;dur=\d+$/);
    });
  });
});
