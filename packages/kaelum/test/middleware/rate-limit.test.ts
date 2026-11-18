import type { Request, Response } from "express";
import { MemoryStore, rateLimit } from "../../src/middleware/rate-limit.js";

// ── Helpers ──────────────────────────────────────────────────────

function mockReq(overrides: Record<string, unknown> = {}): Request {
  return { ip: "127.0.0.1", socket: { remoteAddress: "127.0.0.1" }, ...overrides } as unknown as Request;
}

interface MockResponse extends Response {
  _status: number | null;
  _json: unknown;
  _headers: Record<string, string>;
}

function mockRes(): MockResponse {
  const headers: Record<string, string> = {};
  const res = {
    _status: null as number | null,
    _json: null as unknown,
    _headers: headers,
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._json = body;
      return res;
    },
  };
  return res as unknown as MockResponse;
}

// ── MemoryStore unit tests ───────────────────────────────────────

describe("MemoryStore", () => {
  let store: MemoryStore | undefined;
  afterEach(() => store?.shutdown());

  test("increment tracks hits and returns correct counts", () => {
    store = new MemoryStore(10000);
    const r1 = store.increment("key1");
    expect(r1.totalHits).toBe(1);
    const r2 = store.increment("key1");
    expect(r2.totalHits).toBe(2);
  });

  test("resetKey clears the counter for a specific key", () => {
    store = new MemoryStore(10000);
    store.increment("key1");
    store.increment("key1");
    store.resetKey("key1");
    const r = store.increment("key1");
    expect(r.totalHits).toBe(1);
  });

  test("expired entries are cleaned up", async () => {
    store = new MemoryStore(50); // 50ms window
    store.increment("ephemeral");
    expect(store.hits.size).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 80));
    store._cleanup();
    expect(store.hits.size).toBe(0);
  });
});

// ── Middleware behaviour ─────────────────────────────────────────

describe("rateLimit middleware", () => {
  test("allows requests within the limit", () => {
    const mw = rateLimit({ max: 3, windowMs: 10000 });
    const req = mockReq();
    const res = mockRes();
    let nextCalled = false;

    mw(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(res._status).toBeNull(); // no 429
  });

  test("returns 429 when limit exceeded", () => {
    const mw = rateLimit({ max: 2, windowMs: 10000 });
    const req = mockReq();

    // exhaust the limit
    mw(req, mockRes(), () => {});
    mw(req, mockRes(), () => {});

    // 3rd request should be blocked
    const res = mockRes();
    let nextCalled = false;
    mw(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res._status).toBe(429);
    expect(res._json).toEqual({
      error: { code: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later." },
    });
  });

  test("uses custom message and statusCode", () => {
    const mw = rateLimit({
      max: 1,
      windowMs: 10000,
      message: "Calm down!",
      statusCode: 503,
    });
    const req = mockReq();
    mw(req, mockRes(), () => {});

    const res = mockRes();
    mw(req, res, () => {});

    expect(res._status).toBe(503);
    expect(res._json).toEqual({ error: { code: "SERVICE_UNAVAILABLE", message: "Calm down!" } });
  });

  test("supports custom keyGenerator", () => {
    const mw = rateLimit({
      max: 1,
      windowMs: 10000,
      keyGenerator: (req) => String(req.headers["x-api-key"] ?? "anon"),
    });

    const reqA = mockReq({ headers: { "x-api-key": "aaa" } });
    const reqB = mockReq({ headers: { "x-api-key": "bbb" } });

    // same key limit hit
    mw(reqA, mockRes(), () => {});
    const resA = mockRes();
    mw(reqA, resA, () => {});
    expect(resA._status).toBe(429);

    // different key should still be allowed
    const resB = mockRes();
    let nextB = false;
    mw(reqB, resB, () => { nextB = true; });
    expect(nextB).toBe(true);
  });

  test("skip function bypasses rate limiting", () => {
    const mw = rateLimit({
      max: 1,
      windowMs: 10000,
      skip: (req) => req.path === "/health",
    });

    const req = mockReq({ path: "/health" });
    mw(req, mockRes(), () => {});
    mw(req, mockRes(), () => {});

    // should still pass because skip is true
    const res = mockRes();
    let nextCalled = false;
    mw(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  test("sends standard RateLimit-* headers by default", () => {
    const mw = rateLimit({ max: 5, windowMs: 10000 });
    const req = mockReq();
    const res = mockRes();
    mw(req, res, () => {});

    expect(res._headers["RateLimit-Limit"]).toBe("5");
    expect(res._headers["RateLimit-Remaining"]).toBe("4");
    expect(res._headers["RateLimit-Reset"]).toBeDefined();
  });

  test("sends Retry-After header on 429", () => {
    const mw = rateLimit({ max: 1, windowMs: 60000 });
    const req = mockReq();
    mw(req, mockRes(), () => {});

    const res = mockRes();
    mw(req, res, () => {});

    expect(res._status).toBe(429);
    expect(res._headers["Retry-After"]).toBeDefined();
    expect(Number(res._headers["Retry-After"])).toBeGreaterThan(0);
  });

  test("does not send headers when headers option is false", () => {
    const mw = rateLimit({ max: 5, windowMs: 10000, headers: false });
    const req = mockReq();
    const res = mockRes();
    mw(req, res, () => {});

    expect(res._headers["RateLimit-Limit"]).toBeUndefined();
    expect(res._headers["RateLimit-Remaining"]).toBeUndefined();
  });

  test("attaches rateLimit info to req object", () => {
    const mw = rateLimit({ max: 10, windowMs: 10000 });
    const req = mockReq();
    mw(req, mockRes(), () => {});

    expect(req.rateLimit).toBeDefined();
    expect(req.rateLimit?.limit).toBe(10);
    expect(req.rateLimit?.remaining).toBe(9);
    expect(req.rateLimit?.resetTime).toBeGreaterThan(Date.now() - 1000);
  });

  test("default options work correctly (max: 100, windowMs: 15m)", () => {
    const mw = rateLimit();
    const req = mockReq();
    const res = mockRes();
    mw(req, res, () => {});

    expect(req.rateLimit?.limit).toBe(100);
    expect(req.rateLimit?.remaining).toBe(99);
  });
});
