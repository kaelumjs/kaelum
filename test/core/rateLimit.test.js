// test/core/rateLimit.test.js
const { createRateLimiter, MemoryStore } = require("../../core/rateLimit");

// ── Helpers ──────────────────────────────────────────────────────

function mockReq(overrides = {}) {
  return { ip: "127.0.0.1", connection: { remoteAddress: "127.0.0.1" }, ...overrides };
}

function mockRes() {
  const headers = {};
  const res = {
    _status: null,
    _json: null,
    _headers: headers,
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      res._status = code;
      return res;
    },
    json(body) {
      res._json = body;
      return res;
    },
  };
  return res;
}

// ── MemoryStore unit tests ───────────────────────────────────────

describe("MemoryStore", () => {
  let store;
  afterEach(() => store && store.shutdown());

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

  test("expired entries are cleaned up", (done) => {
    store = new MemoryStore(50); // 50ms window
    store.increment("ephemeral");
    expect(store.hits.size).toBe(1);

    setTimeout(() => {
      store._cleanup();
      expect(store.hits.size).toBe(0);
      done();
    }, 80);
  });
});

// ── Middleware behaviour ─────────────────────────────────────────

describe("createRateLimiter middleware", () => {
  test("allows requests within the limit", () => {
    const mw = createRateLimiter({ max: 3, windowMs: 10000 });
    const req = mockReq();
    const res = mockRes();
    let nextCalled = false;

    mw(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(res._status).toBeNull(); // no 429
    mw._store.shutdown();
  });

  test("returns 429 when limit exceeded", () => {
    const mw = createRateLimiter({ max: 2, windowMs: 10000 });
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
      error: "Too many requests, please try again later.",
    });
    mw._store.shutdown();
  });

  test("uses custom message and statusCode", () => {
    const mw = createRateLimiter({
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
    expect(res._json).toEqual({ error: "Calm down!" });
    mw._store.shutdown();
  });

  test("supports custom keyGenerator", () => {
    const mw = createRateLimiter({
      max: 1,
      windowMs: 10000,
      keyGenerator: (req) => req.headers["x-api-key"] || "anon",
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
    mw._store.shutdown();
  });

  test("skip function bypasses rate limiting", () => {
    const mw = createRateLimiter({
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
    mw._store.shutdown();
  });

  test("sends standard RateLimit-* headers by default", () => {
    const mw = createRateLimiter({ max: 5, windowMs: 10000 });
    const req = mockReq();
    const res = mockRes();
    mw(req, res, () => {});

    expect(res._headers["RateLimit-Limit"]).toBe("5");
    expect(res._headers["RateLimit-Remaining"]).toBe("4");
    expect(res._headers["RateLimit-Reset"]).toBeDefined();
    mw._store.shutdown();
  });

  test("sends Retry-After header on 429", () => {
    const mw = createRateLimiter({ max: 1, windowMs: 60000 });
    const req = mockReq();
    mw(req, mockRes(), () => {});

    const res = mockRes();
    mw(req, res, () => {});

    expect(res._status).toBe(429);
    expect(res._headers["Retry-After"]).toBeDefined();
    expect(Number(res._headers["Retry-After"])).toBeGreaterThan(0);
    mw._store.shutdown();
  });

  test("does not send headers when headers option is false", () => {
    const mw = createRateLimiter({ max: 5, windowMs: 10000, headers: false });
    const req = mockReq();
    const res = mockRes();
    mw(req, res, () => {});

    expect(res._headers["RateLimit-Limit"]).toBeUndefined();
    expect(res._headers["RateLimit-Remaining"]).toBeUndefined();
    mw._store.shutdown();
  });

  test("attaches rateLimit info to req object", () => {
    const mw = createRateLimiter({ max: 10, windowMs: 10000 });
    const req = mockReq();
    mw(req, mockRes(), () => {});

    expect(req.rateLimit).toBeDefined();
    expect(req.rateLimit.limit).toBe(10);
    expect(req.rateLimit.remaining).toBe(9);
    expect(req.rateLimit.resetTime).toBeGreaterThan(Date.now() - 1000);
    mw._store.shutdown();
  });

  test("default options work correctly (max: 100, windowMs: 15m)", () => {
    const mw = createRateLimiter();
    const req = mockReq();
    const res = mockRes();
    mw(req, res, () => {});

    expect(req.rateLimit.limit).toBe(100);
    expect(req.rateLimit.remaining).toBe(99);
    mw._store.shutdown();
  });
});
