const createApp = require("../../createApp");
const request = require("supertest");

describe("core/group", () => {
  // ---------------------------------------------------------
  // Basic prefix routing
  // ---------------------------------------------------------
  describe("Basic prefix routing", () => {
    it("should scope addRoute routes under the group prefix", async () => {
      const app = createApp();
      const admin = app.group("/admin");
      admin.addRoute("/users", { get: (req, res) => res.json({ users: [] }) });

      const res = await request(app).get("/admin/users");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ users: [] });
    });

    it("should not expose grouped routes at the unprefixed path", async () => {
      const app = createApp();
      const grp = app.group("/v2");
      grp.addRoute("/ping", { get: (req, res) => res.json({ ok: true }) });

      const res = await request(app).get("/ping");
      expect(res.status).toBe(404);
    });

    it("should support multiple routes within the same group", async () => {
      const app = createApp();
      const api = app.group("/api");
      api.addRoute("/a", { get: (req, res) => res.json({ route: "a" }) });
      api.addRoute("/b", { get: (req, res) => res.json({ route: "b" }) });

      const ra = await request(app).get("/api/a");
      const rb = await request(app).get("/api/b");
      expect(ra.body).toEqual({ route: "a" });
      expect(rb.body).toEqual({ route: "b" });
    });
  });

  // ---------------------------------------------------------
  // apiRoute inside a group
  // ---------------------------------------------------------
  describe("apiRoute inside group", () => {
    it("should register REST routes under the group prefix", async () => {
      const app = createApp();
      const api = app.group("/api/v1");
      api.apiRoute("products", {
        get: (req, res) => res.json({ products: [] }),
        post: (req, res) => res.status(201).json({ created: true }),
      });

      const list = await request(app).get("/api/v1/products");
      const create = await request(app).post("/api/v1/products");
      expect(list.status).toBe(200);
      expect(list.body).toEqual({ products: [] });
      expect(create.status).toBe(201);
    });
  });

  // ---------------------------------------------------------
  // Shared middleware
  // ---------------------------------------------------------
  describe("Shared middleware", () => {
    it("should apply shared middleware to all routes in the group", async () => {
      const app = createApp();
      const hits = [];
      const recorder = (req, res, next) => {
        hits.push(req.path);
        next();
      };

      const grp = app.group("/api", recorder);
      grp.addRoute("/x", { get: (req, res) => res.json({ x: 1 }) });
      grp.addRoute("/y", { get: (req, res) => res.json({ y: 2 }) });

      await request(app).get("/api/x");
      await request(app).get("/api/y");

      expect(hits).toContain("/x");
      expect(hits).toContain("/y");
    });

    it("should not apply group middleware to routes outside the group", async () => {
      const app = createApp();
      let touched = false;
      const tracer = (req, res, next) => {
        touched = true;
        next();
      };

      const grp = app.group("/scoped", tracer);
      grp.addRoute("/in", { get: (req, res) => res.json({ ok: true }) });
      app.get("/out", (req, res) => res.json({ ok: true }));

      // reset
      touched = false;
      await request(app).get("/out");
      expect(touched).toBe(false);

      await request(app).get("/scoped/in");
      expect(touched).toBe(true);
    });

    it("should support multiple middleware arguments", async () => {
      const app = createApp();
      const log = [];
      const mw1 = (req, res, next) => { log.push(1); next(); };
      const mw2 = (req, res, next) => { log.push(2); next(); };

      const grp = app.group("/multi", mw1, mw2);
      grp.addRoute("/test", { get: (req, res) => res.json({ log }) });

      await request(app).get("/multi/test");
      expect(log).toEqual([1, 2]);
    });
  });

  // ---------------------------------------------------------
  // Chaining
  // ---------------------------------------------------------
  describe("Chaining", () => {
    it("should return the group for chaining on addRoute", async () => {
      const app = createApp();
      const grp = app.group("/chain");
      const result = grp.addRoute("/a", { get: (req, res) => res.json({}) });
      expect(result).toBe(grp);
    });

    it("should support chained addRoute calls", async () => {
      const app = createApp();
      app
        .group("/chain")
        .addRoute("/a", { get: (req, res) => res.json({ route: "a" }) })
        .addRoute("/b", { get: (req, res) => res.json({ route: "b" }) });

      const ra = await request(app).get("/chain/a");
      const rb = await request(app).get("/chain/b");
      expect(ra.body).toEqual({ route: "a" });
      expect(rb.body).toEqual({ route: "b" });
    });
  });

  // ---------------------------------------------------------
  // Nested groups
  // ---------------------------------------------------------
  describe("Nested groups", () => {
    it("should support groups nested inside groups", async () => {
      const app = createApp();
      const v2 = app.group("/api/v2");
      const products = v2.group("/products");
      products.addRoute("/", { get: (req, res) => res.json({ list: true }) });

      const res = await request(app).get("/api/v2/products/");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ list: true });
    });

    it("should isolate nested group middleware from sibling groups", async () => {
      const app = createApp();
      const hits = [];
      const tracer = (req, res, next) => { hits.push("admin-mw"); next(); };

      const api = app.group("/api");
      const admin = api.group("/admin", tracer);
      admin.addRoute("/users", { get: (req, res) => res.json({ users: [] }) });

      const pub = api.group("/public");
      pub.addRoute("/info", { get: (req, res) => res.json({ info: true }) });

      await request(app).get("/api/public/info");
      expect(hits).toHaveLength(0); // tracer not called for public

      await request(app).get("/api/admin/users");
      expect(hits).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------
  describe("Validation", () => {
    it("should throw if prefix is not a string", () => {
      const app = createApp();
      expect(() => app.group(123)).toThrow();
    });

    it("should throw if prefix is empty", () => {
      const app = createApp();
      expect(() => app.group("")).toThrow();
    });

    it("should throw if a middleware argument is not a function", () => {
      const app = createApp();
      expect(() => app.group("/bad", "not-a-function")).toThrow();
    });

    it("should expose the correct prefix on the returned group", () => {
      const app = createApp();
      const grp = app.group("/test");
      expect(grp.prefix).toBe("/test");
    });

    it("should normalise prefix — add leading slash", () => {
      const app = createApp();
      const grp = app.group("no-slash");
      expect(grp.prefix).toBe("/no-slash");
    });

    it("should normalise prefix — strip trailing slash", () => {
      const app = createApp();
      const grp = app.group("/trailing/");
      expect(grp.prefix).toBe("/trailing");
    });
  });
});
