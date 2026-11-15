const createApp = require("../../createApp");
const request = require("supertest");

describe("core/timing", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    app.timing();
    app.get("/test", (req, res) => res.json({ ok: true }));
  });

  it("should add Server-Timing header to every response", async () => {
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    expect(res.headers["server-timing"]).toBeDefined();
  });

  it("should follow W3C Server-Timing format", async () => {
    const res = await request(app).get("/test");
    const timing = res.headers["server-timing"];
    // Format: total;dur=X.XX
    expect(timing).toMatch(/^total;dur=\d+\.\d+$/);
  });

  it("should report a positive duration", async () => {
    const res = await request(app).get("/test");
    const timing = res.headers["server-timing"];
    const dur = parseFloat(timing.split("=")[1]);
    expect(dur).toBeGreaterThanOrEqual(0);
    expect(typeof dur).toBe("number");
    expect(Number.isNaN(dur)).toBe(false);
  });

  it("should support custom precision", async () => {
    const customApp = createApp();
    customApp.timing({ precision: 4 });
    customApp.get("/test", (req, res) => res.json({ ok: true }));

    const res = await request(customApp).get("/test");
    const timing = res.headers["server-timing"];
    const durStr = timing.split("=")[1];
    // Should have exactly 4 decimal places
    const decimals = durStr.split(".")[1];
    expect(decimals.length).toBe(4);
  });

  it("should not duplicate middleware on re-registration", async () => {
    const app2 = createApp();
    app2.timing();
    app2.timing(); // second call should be no-op
    app2.get("/test", (req, res) => res.json({ ok: true }));

    const res = await request(app2).get("/test");
    const timing = res.headers["server-timing"];
    // Should only have one "total" entry, not duplicated
    expect(timing).toMatch(/^total;dur=\d+\.\d+$/);
    expect(timing.split("total").length - 1).toBe(1);
  });

  it("should return app for chaining", () => {
    const chainApp = createApp();
    const result = chainApp.timing();
    expect(result).toBe(chainApp);
  });

  it("should work together with requestId", async () => {
    const combinedApp = createApp();
    combinedApp.requestId().timing();
    combinedApp.get("/test", (req, res) => res.json({ id: req.id }));

    const res = await request(combinedApp).get("/test");
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.headers["server-timing"]).toBeDefined();
    expect(res.headers["server-timing"]).toMatch(/^total;dur=\d+\.\d+$/);
  });
});
