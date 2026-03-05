const express = require("express");
const request = require("supertest");
const setMiddleware = require("../../core/setMiddleware");

describe("core/setMiddleware", () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  test("should register a single middleware function", async () => {
    setMiddleware(app, (req, res, next) => {
      req.tagged = true;
      next();
    });

    app.get("/test", (req, res) => res.json({ tagged: req.tagged }));

    const res = await request(app).get("/test");
    expect(res.body.tagged).toBe(true);
  });

  test("should register an array of middlewares", async () => {
    const mw1 = (req, res, next) => {
      req.step = "1";
      next();
    };
    const mw2 = (req, res, next) => {
      req.step += "2";
      next();
    };

    setMiddleware(app, [mw1, mw2]);
    app.get("/test", (req, res) => res.send(req.step));

    const res = await request(app).get("/test");
    expect(res.text).toBe("12");
  });

  test("should register middleware on a specific path", async () => {
    setMiddleware(app, "/admin", (req, res, next) => {
      req.admin = true;
      next();
    });

    app.get("/admin/dashboard", (req, res) =>
      res.json({ admin: req.admin || false })
    );
    app.get("/public", (req, res) =>
      res.json({ admin: req.admin || false })
    );

    const adminRes = await request(app).get("/admin/dashboard");
    expect(adminRes.body.admin).toBe(true);

    const publicRes = await request(app).get("/public");
    expect(publicRes.body.admin).toBe(false);
  });

  test("should return array of registered entries", () => {
    const result = setMiddleware(app, (req, res, next) => next());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("handler");
    expect(result[0].path).toBeNull();
  });

  test("should track middlewares in app.locals", () => {
    setMiddleware(app, (req, res, next) => next());
    expect(app.locals._kaelum_middlewares).toHaveLength(1);
  });

  test("should remove tracked middlewares via remove()", () => {
    setMiddleware(app, (req, res, next) => next());
    expect(app.locals._kaelum_middlewares).toHaveLength(1);

    setMiddleware.remove(app);
    expect(app.locals._kaelum_middlewares).toHaveLength(0);
  });

  test("should throw on invalid app", () => {
    expect(() => setMiddleware(null, () => {})).toThrow("Invalid app instance");
  });

  test("should throw on non-function middleware", () => {
    expect(() => setMiddleware(app, "not-a-function")).toThrow(
      "Middleware must be a function"
    );
  });

  test("should throw on array with non-function elements", () => {
    expect(() => setMiddleware(app, [() => {}, "bad"])).toThrow(
      "All middlewares in array must be functions"
    );
  });
});
