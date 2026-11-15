const createApp = require("../createApp");
const { testApp } = require("../test-utils/index");

// Helper: build a minimal app to test against
function buildApp() {
  const app = createApp();

  app.get("/users", (req, res) => {
    res.json({ users: [], query: req.query });
  });

  app.post("/users", (req, res) => {
    res.status(201).json({ created: true, data: req.body });
  });

  app.put("/users/:id", (req, res) => {
    res.json({ updated: true, id: req.params.id, data: req.body });
  });

  app.patch("/users/:id", (req, res) => {
    res.json({ patched: true, data: req.body });
  });

  app.delete("/users/:id", (req, res) => {
    res.status(204).end();
  });

  app.head("/ping", (req, res) => {
    res.status(200).end();
  });

  app.get("/headers-check", (req, res) => {
    res.json({ received: req.headers["x-custom-header"] });
  });

  app.get("/auth-check", (req, res) => {
    res.json({ authorization: req.headers["authorization"] || null });
  });

  return app;
}

describe("test-utils/testApp", () => {
  let client;

  beforeAll(() => {
    client = testApp(buildApp());
  });

  // -------------------------------------------------------------------------
  // Factory validation
  // -------------------------------------------------------------------------
  describe("factory", () => {
    it("should throw if app is not provided", () => {
      expect(() => testApp()).toThrow();
    });

    it("should throw if app is not a function", () => {
      expect(() => testApp({ use: () => {} })).toThrow();
    });

    it("should return a client with all HTTP methods", () => {
      const c = testApp(buildApp());
      expect(typeof c.get).toBe("function");
      expect(typeof c.post).toBe("function");
      expect(typeof c.put).toBe("function");
      expect(typeof c.patch).toBe("function");
      expect(typeof c.delete).toBe("function");
      expect(typeof c.head).toBe("function");
    });
  });

  // -------------------------------------------------------------------------
  // HTTP methods
  // -------------------------------------------------------------------------
  describe("HTTP methods", () => {
    it("get() should perform a GET request", async () => {
      const res = await client.get("/users");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
    });

    it("post() with body should perform a POST and send JSON", async () => {
      const res = await client.post("/users", {
        body: { name: "Alice", email: "alice@example.com" },
      });
      expect(res.status).toBe(201);
      expect(res.body.created).toBe(true);
      expect(res.body.data.name).toBe("Alice");
    });

    it("put() with body should perform a PUT request", async () => {
      const res = await client.put("/users/42", {
        body: { name: "Bob" },
      });
      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
      expect(res.body.id).toBe("42");
    });

    it("patch() with body should perform a PATCH request", async () => {
      const res = await client.patch("/users/1", {
        body: { name: "Charlie" },
      });
      expect(res.status).toBe(200);
      expect(res.body.patched).toBe(true);
    });

    it("delete() should perform a DELETE request", async () => {
      const res = await client.delete("/users/1");
      expect(res.status).toBe(204);
    });

    it("head() should perform a HEAD request (no body)", async () => {
      const res = await client.head("/ping");
      expect(res.status).toBe(200);
      expect(res.text).toBeFalsy();
    });
  });

  // -------------------------------------------------------------------------
  // Options: headers
  // -------------------------------------------------------------------------
  describe("headers option", () => {
    it("should send custom headers", async () => {
      const res = await client.get("/headers-check", {
        headers: { "X-Custom-Header": "kaelum-test" },
      });
      expect(res.status).toBe(200);
      expect(res.body.received).toBe("kaelum-test");
    });
  });

  // -------------------------------------------------------------------------
  // Options: query
  // -------------------------------------------------------------------------
  describe("query option", () => {
    it("should append query params to the URL", async () => {
      const res = await client.get("/users", {
        query: { page: 2, limit: 10 },
      });
      expect(res.status).toBe(200);
      expect(res.body.query.page).toBe("2");
      expect(res.body.query.limit).toBe("10");
    });
  });

  // -------------------------------------------------------------------------
  // Options: auth
  // -------------------------------------------------------------------------
  describe("auth option", () => {
    it("auth.bearer should set Authorization: Bearer header", async () => {
      const res = await client.get("/auth-check", {
        auth: { bearer: "my-secret-token" },
      });
      expect(res.status).toBe(200);
      expect(res.body.authorization).toBe("Bearer my-secret-token");
    });

    it("auth.basic should set Authorization: Basic header (base64)", async () => {
      const res = await client.get("/auth-check", {
        auth: { basic: "user:password" },
      });
      const expected = "Basic " + Buffer.from("user:password").toString("base64");
      expect(res.body.authorization).toBe(expected);
    });
  });
});
