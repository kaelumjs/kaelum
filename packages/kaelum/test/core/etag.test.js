const createApp = require("../../createApp");
const request = require("supertest");

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeApp(etagOpts) {
  const app = createApp();
  app.useEtag(etagOpts);

  // Dynamic body: use query param to vary response
  app.get("/data", (req, res) => {
    res.json({ value: req.query.v || "default" });
  });

  app.get("/no-etag", (req, res) => {
    res.json({ ok: true });
  });

  app.post("/data", (req, res) => {
    res.status(201).json({ created: true });
  });

  return app;
}

describe("core/etag", () => {
  // -------------------------------------------------------------------------
  // ETag presence
  // -------------------------------------------------------------------------
  describe("ETag header generation", () => {
    it("GET response includes ETag header", async () => {
      const app = makeApp();
      const res = await request(app).get("/data");
      expect(res.status).toBe(200);
      expect(res.headers["etag"]).toBeDefined();
    });

    it("strong ETag does not start with W/", async () => {
      const app = makeApp({ weak: false });
      const res = await request(app).get("/data");
      expect(res.headers["etag"]).toBeDefined();
      expect(res.headers["etag"]).not.toMatch(/^W\//);
    });

    it("weak ETag starts with W/", async () => {
      const app = makeApp({ weak: true });
      const res = await request(app).get("/data");
      expect(res.headers["etag"]).toMatch(/^W\//);
    });
  });

  // -------------------------------------------------------------------------
  // Conditional requests (304)
  // -------------------------------------------------------------------------
  describe("304 Not Modified", () => {
    it("returns 304 when If-None-Match matches current ETag", async () => {
      const app = makeApp();

      // First request — get the ETag
      const first = await request(app).get("/data");
      const etag = first.headers["etag"];
      expect(etag).toBeDefined();

      // Second request with matching ETag
      const second = await request(app)
        .get("/data")
        .set("If-None-Match", etag);
      expect(second.status).toBe(304);
    });

    it("returns 200 with new ETag when body changes", async () => {
      const app = makeApp();

      const first = await request(app).get("/data?v=1");
      const etag1 = first.headers["etag"];

      // Different query → different body → different ETag
      const second = await request(app)
        .get("/data?v=2")
        .set("If-None-Match", etag1);
      expect(second.status).toBe(200);
      expect(second.headers["etag"]).not.toBe(etag1);
    });

    it("returns 200 when If-None-Match is a stale ETag", async () => {
      const app = makeApp();
      const res = await request(app)
        .get("/data")
        .set("If-None-Match", '"stale-etag-value"');
      expect(res.status).toBe(200);
    });
  });



  // -------------------------------------------------------------------------
  // Exclude paths
  // -------------------------------------------------------------------------
  describe("exclude paths", () => {
    it("excluded path does not have ETag header", async () => {
      const app = createApp();
      app.useEtag({ exclude: ["/no-etag"] });
      app.get("/no-etag", (req, res) => res.json({ ok: true }));
      app.get("/has-etag", (req, res) => res.json({ ok: true }));

      const excluded = await request(app).get("/no-etag");
      expect(excluded.headers["etag"]).toBeUndefined();

      const included = await request(app).get("/has-etag");
      expect(included.headers["etag"]).toBeDefined();
    });

    it("wildcard exclude (/stream/*) suppresses ETag for sub-paths", async () => {
      const app = createApp();
      app.useEtag({ exclude: ["/stream/*"] });
      app.get("/stream/events", (req, res) => res.json({ ok: true }));
      app.get("/data", (req, res) => res.json({ ok: true }));

      const stream = await request(app).get("/stream/events");
      expect(stream.headers["etag"]).toBeUndefined();

      const data = await request(app).get("/data");
      expect(data.headers["etag"]).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // setConfig integration
  // -------------------------------------------------------------------------
  describe("setConfig integration", () => {
    it("setConfig({ etag: true }) activates strong ETags", async () => {
      const app = createApp();
      app.setConfig({ etag: true });
      app.get("/data", (req, res) => res.json({ ok: true }));

      const res = await request(app).get("/data");
      expect(res.headers["etag"]).toBeDefined();
      expect(res.headers["etag"]).not.toMatch(/^W\//);
    });

    it("setConfig({ etag: { weak: true } }) activates weak ETags", async () => {
      const app = createApp();
      app.setConfig({ etag: { weak: true } });
      app.get("/data", (req, res) => res.json({ ok: true }));

      const res = await request(app).get("/data");
      expect(res.headers["etag"]).toMatch(/^W\//);
    });

    it("setConfig({ etag: false }) disables ETags", async () => {
      const app = createApp();
      app.setConfig({ etag: true });
      app.setConfig({ etag: false });
      app.get("/data", (req, res) => res.json({ ok: true }));

      const res = await request(app).get("/data");
      expect(res.headers["etag"]).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Chaining
  // -------------------------------------------------------------------------
  describe("useEtag chaining", () => {
    it("app.useEtag() returns app for chaining", () => {
      const app = createApp();
      const result = app.useEtag();
      expect(result).toBe(app);
    });
  });
});
