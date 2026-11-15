const createApp = require("../../createApp");
const { originCheck, doubleSubmit } = require("../../core/csrf");
const request = require("supertest");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOriginApp(opts) {
  const app = createApp();
  app.use(originCheck(opts));
  app.post("/test", (req, res) => res.json({ ok: true }));
  app.put("/test", (req, res) => res.json({ ok: true }));
  app.get("/test", (req, res) => res.json({ ok: true }));
  return app;
}

function makeDoubleApp(opts) {
  const app = createApp();
  app.use(doubleSubmit(opts));
  app.get("/csrf-token", (req, res) => res.json({ token: req._csrfToken }));
  app.post("/test", (req, res) => res.json({ ok: true }));
  app.get("/test", (req, res) => res.json({ ok: true }));
  return app;
}

// ---------------------------------------------------------------------------
// Mode 1: Origin Check
// ---------------------------------------------------------------------------

describe("core/csrf — originCheck", () => {
  describe("safe methods always pass", () => {
    const app = makeOriginApp({ origin: "https://myapp.com" });

    it("GET passes without Origin header", async () => {
      const res = await request(app).get("/test");
      expect(res.status).toBe(200);
    });

    it("HEAD passes without Origin header", async () => {
      const res = await request(app).head("/test");
      expect(res.status).toBe(200);
    });
  });

  describe("mutating methods without Origin", () => {
    it("POST without Origin → 403", async () => {
      const app = makeOriginApp({ origin: "https://myapp.com" });
      const res = await request(app).post("/test").send({});
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("CSRF validation failed");
    });

    it("PUT without Origin → 403", async () => {
      const app = makeOriginApp({ origin: "https://myapp.com" });
      const res = await request(app).put("/test").send({});
      expect(res.status).toBe(403);
    });
  });

  describe("invalid origin", () => {
    it("POST with wrong origin → 403", async () => {
      const app = makeOriginApp({ origin: "https://myapp.com" });
      const res = await request(app)
        .post("/test")
        .set("Origin", "https://evil.com")
        .send({});
      expect(res.status).toBe(403);
    });
  });

  describe("valid origin", () => {
    it("POST with correct origin → 200", async () => {
      const app = makeOriginApp({ origin: "https://myapp.com" });
      const res = await request(app)
        .post("/test")
        .set("Origin", "https://myapp.com")
        .send({});
      expect(res.status).toBe(200);
    });

    it("accepts Referer header as fallback", async () => {
      const app = makeOriginApp({ origin: "https://myapp.com" });
      const res = await request(app)
        .post("/test")
        .set("Referer", "https://myapp.com/page")
        .send({});
      expect(res.status).toBe(200);
    });

    it("accepts array of allowed origins", async () => {
      const app = makeOriginApp({
        origin: ["https://myapp.com", "https://staging.myapp.com"],
      });
      const ok = await request(app)
        .post("/test")
        .set("Origin", "https://staging.myapp.com")
        .send({});
      expect(ok.status).toBe(200);

      const fail = await request(app)
        .post("/test")
        .set("Origin", "https://evil.com")
        .send({});
      expect(fail.status).toBe(403);
    });
  });

  describe("exclude paths", () => {
    it("POST on excluded path passes without Origin", async () => {
      const app = makeOriginApp({
        origin: "https://myapp.com",
        exclude: ["/test"],
      });
      const res = await request(app).post("/test").send({});
      expect(res.status).toBe(200);
    });

    it("POST on non-excluded path still blocked", async () => {
      const app = createApp();
      app.use(originCheck({ origin: "https://myapp.com", exclude: ["/other"] }));
      app.post("/test", (req, res) => res.json({ ok: true }));
      const res = await request(app).post("/test").send({});
      expect(res.status).toBe(403);
    });

    it("wildcard exclude (/api/*) excludes sub-paths", async () => {
      const app = createApp();
      app.use(originCheck({ origin: "https://myapp.com", exclude: ["/api/*"] }));
      app.post("/api/webhooks", (req, res) => res.json({ ok: true }));
      app.post("/other", (req, res) => res.json({ ok: true }));

      const ok = await request(app).post("/api/webhooks").send({});
      expect(ok.status).toBe(200);

      const fail = await request(app).post("/other").send({});
      expect(fail.status).toBe(403);
    });
  });

  describe("setConfig integration", () => {
    it("setConfig({ csrf: true }) installs originCheck middleware", async () => {
      const app = createApp();
      app.setConfig({ csrf: { origin: "https://trusted.com" } });
      app.post("/test", (req, res) => res.json({ ok: true }));

      const fail = await request(app)
        .post("/test")
        .set("Origin", "https://evil.com")
        .send({});
      expect(fail.status).toBe(403);

      const ok = await request(app)
        .post("/test")
        .set("Origin", "https://trusted.com")
        .send({});
      expect(ok.status).toBe(200);
    });
  });
});

// ---------------------------------------------------------------------------
// Mode 2: Double Submit Cookie
// ---------------------------------------------------------------------------

describe("core/csrf — doubleSubmit", () => {
  describe("token generation", () => {
    it("GET sets csrf-token cookie on the response", async () => {
      const app = makeDoubleApp();
      const res = await request(app).get("/test");
      expect(res.status).toBe(200);
      const setCookie = res.headers["set-cookie"];
      expect(setCookie).toBeDefined();
      expect(setCookie.some((c) => c.startsWith("csrf-token="))).toBe(true);
    });
  });

  describe("mutating requests", () => {
    it("POST without cookie → 403", async () => {
      const app = makeDoubleApp();
      const res = await request(app).post("/test").send({});
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("CSRF validation failed");
    });

    it("POST with cookie but no header → 403", async () => {
      const app = makeDoubleApp();
      const res = await request(app)
        .post("/test")
        .set("Cookie", "csrf-token=abc123")
        .send({});
      expect(res.status).toBe(403);
    });

    it("POST with mismatched cookie and header → 403", async () => {
      const app = makeDoubleApp();
      const res = await request(app)
        .post("/test")
        .set("Cookie", "csrf-token=abc123")
        .set("X-CSRF-Token", "wrongtoken")
        .send({});
      expect(res.status).toBe(403);
    });

    it("POST with matching cookie and header → 200", async () => {
      const app = makeDoubleApp();
      const token = "a".repeat(64); // 64-char hex-like token
      const res = await request(app)
        .post("/test")
        .set("Cookie", `csrf-token=${token}`)
        .set("X-CSRF-Token", token)
        .send({});
      expect(res.status).toBe(200);
    });
  });

  describe("useCsrf chaining", () => {
    it("app.useCsrf() returns app for chaining", () => {
      const app = createApp();
      const result = app.useCsrf();
      expect(result).toBe(app);
    });
  });
});
