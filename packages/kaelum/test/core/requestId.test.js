const createApp = require("../../createApp");
const request = require("supertest");

describe("core/requestId", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    app.requestId();
    app.get("/test", (req, res) => {
      res.json({ id: req.id });
    });
  });

  it("should add X-Request-Id header to every response", async () => {
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.headers["x-request-id"].length).toBeGreaterThan(0);
  });

  it("should generate a valid UUID format", async () => {
    const res = await request(app).get("/test");
    const id = res.headers["x-request-id"];
    // UUID v4 pattern
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("should preserve existing request ID from upstream", async () => {
    const existingId = "upstream-trace-id-123";
    const res = await request(app)
      .get("/test")
      .set("X-Request-Id", existingId);

    expect(res.headers["x-request-id"]).toBe(existingId);
    expect(res.body.id).toBe(existingId);
  });

  it("should expose id on req.id in handlers", async () => {
    const res = await request(app).get("/test");
    expect(res.body.id).toBeDefined();
    expect(res.body.id).toBe(res.headers["x-request-id"]);
  });

  it("should support custom header name", async () => {
    const customApp = createApp();
    customApp.requestId({ headerName: "X-Trace-Id" });
    customApp.get("/test", (req, res) => res.json({ id: req.id }));

    const res = await request(customApp).get("/test");
    expect(res.headers["x-trace-id"]).toBeDefined();
    expect(res.body.id).toBe(res.headers["x-trace-id"]);
  });

  it("should support custom generator function", async () => {
    const customApp = createApp();
    let callCount = 0;
    customApp.requestId({
      generator: () => {
        callCount++;
        return `custom-${callCount}`;
      },
    });
    customApp.get("/test", (req, res) => res.json({ id: req.id }));

    const res = await request(customApp).get("/test");
    expect(res.headers["x-request-id"]).toBe("custom-1");
    expect(res.body.id).toBe("custom-1");
    expect(callCount).toBe(1);
  });

  it("should not duplicate middleware on re-registration", async () => {
    const app2 = createApp();
    let idCount = 0;
    const gen = () => {
      idCount++;
      return `id-${idCount}`;
    };

    app2.requestId({ generator: gen });
    app2.requestId({ generator: gen }); // second call should be no-op
    app2.get("/test", (req, res) => res.json({ id: req.id }));

    await request(app2).get("/test");
    // Generator should only be called once per request (not twice)
    expect(idCount).toBe(1);
  });

  it("should return app for chaining", () => {
    const chainApp = createApp();
    const result = chainApp.requestId();
    expect(result).toBe(chainApp);
  });
});
