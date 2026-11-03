const request = require("supertest");
const createApp = require("../../createApp");

describe("core/trailingSlash", () => {
  it("redirects /path/ to /path with 301", async () => {
    const app = createApp();
    app.useTrimTrailingSlash();
    app.get("/users", (req, res) => res.json([]));

    const res = await request(app).get("/users/").redirects(0);
    expect(res.status).toBe(301);
    expect(res.headers["location"]).toBe("/users");
  });

  it("does NOT redirect the root path /", async () => {
    const app = createApp();
    app.useTrimTrailingSlash();
    app.get("/", (req, res) => res.json({ root: true }));

    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });

  it("preserves query string in redirect", async () => {
    const app = createApp();
    app.useTrimTrailingSlash();
    app.get("/search", (req, res) => res.json({ q: req.query.q }));

    const res = await request(app).get("/search/?q=hello").redirects(0);
    expect(res.status).toBe(301);
    expect(res.headers["location"]).toBe("/search?q=hello");
  });

  it("accepts custom status code via options", async () => {
    const app = createApp();
    app.useTrimTrailingSlash({ status: 308 });
    app.get("/items", (req, res) => res.json([]));

    const res = await request(app).get("/items/").redirects(0);
    expect(res.status).toBe(308);
  });

  it("supports setConfig({ trimTrailingSlash: true })", async () => {
    const app = createApp();
    app.setConfig({ trimTrailingSlash: true });
    app.get("/api", (req, res) => res.json({ ok: true }));

    const res = await request(app).get("/api/").redirects(0);
    expect(res.status).toBe(301);
    expect(res.headers["location"]).toBe("/api");
  });
});
