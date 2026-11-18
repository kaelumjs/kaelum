import express from "express";
import request from "supertest";
import { serverTiming, type TimingOptions } from "../../src/middleware/timing.js";

function makeApp(options?: TimingOptions) {
  const app = express();
  app.use(serverTiming(options));
  app.get("/test", (_req, res) => res.json({ ok: true }));
  return app;
}

describe("serverTiming", () => {
  test("adds a Server-Timing header in the W3C format", async () => {
    const res = await request(makeApp()).get("/test");
    expect(res.status).toBe(200);
    expect(res.headers["server-timing"]).toMatch(/^total;dur=\d+\.\d{2}$/);
  });

  test("reports a non-negative duration", async () => {
    const res = await request(makeApp()).get("/test");
    const dur = parseFloat(String(res.headers["server-timing"]).split("=")[1] ?? "");
    expect(dur).toBeGreaterThanOrEqual(0);
  });

  test("precision and header name are configurable", async () => {
    const res = await request(makeApp({ precision: 4, headerName: "X-Time" })).get("/test");
    expect(res.headers["x-time"]).toMatch(/^total;dur=\d+\.\d{4}$/);
    expect(res.headers["server-timing"]).toBeUndefined();
  });

  test("keeps a header the handler already set", async () => {
    const app = express();
    app.use(serverTiming());
    app.get("/test", (_req, res) => {
      res.setHeader("Server-Timing", "db;dur=1");
      res.end();
    });

    const res = await request(app).get("/test");
    expect(res.headers["server-timing"]).toBe("db;dur=1");
  });
});
