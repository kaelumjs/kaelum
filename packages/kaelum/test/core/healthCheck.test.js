const express = require("express");
const request = require("supertest");
const registerHealth = require("../../core/healthCheck");

describe("core/healthCheck", () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  test("should register default /health endpoint", async () => {
    registerHealth(app);

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  test("should include uptime, pid, env, and timestamp by default", async () => {
    registerHealth(app);

    const res = await request(app).get("/health");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("pid");
    expect(res.body).toHaveProperty("env");
    expect(res.body).toHaveProperty("timestamp");
  });

  test("should accept custom path as string", async () => {
    registerHealth(app, "/status");

    const res = await request(app).get("/status");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  test("should accept options object with custom path", async () => {
    registerHealth(app, { path: "/alive" });

    const res = await request(app).get("/alive");
    expect(res.status).toBe(200);
  });

  test("should return 503 when readinessCheck fails", async () => {
    registerHealth(app, {
      readinessCheck: async () => ({ ok: false, details: { db: false } }),
    });

    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("FAIL");
    expect(res.body.details).toEqual({ db: false });
  });

  test("should return 200 when readinessCheck succeeds", async () => {
    registerHealth(app, {
      readinessCheck: async () => ({ ok: true }),
    });

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  test("should return 503 when readinessCheck throws", async () => {
    registerHealth(app, {
      readinessCheck: () => {
        throw new Error("DB connection failed");
      },
    });

    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.details.message).toBe("DB connection failed");
  });

  test("should skip duplicate registration when replace is false", () => {
    const h1 = registerHealth(app);
    const h2 = registerHealth(app); // same path, replace=false
    expect(h1).toBeTruthy();
    expect(h2).toBeNull();
  });

  test("should throw on invalid app", () => {
    expect(() => registerHealth(null)).toThrow("Invalid app instance");
  });
});
