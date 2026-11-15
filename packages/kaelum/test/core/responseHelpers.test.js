const createApp = require("../../createApp");
const request = require("supertest");

describe("core/responseHelpers", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    app.useResponseHelpers();
  });

  describe("Success methods", () => {
    it("res.ok() should return 200 and text when given a string", async () => {
      app.get("/ok-string", (req, res) => res.ok("hello"));
      const res = await request(app).get("/ok-string");
      expect(res.status).toBe(200);
      expect(res.text).toBe("hello");
      expect(res.headers["content-type"]).toMatch(/text\/html/);
    });

    it("res.ok() should return 200 and json when given an object", async () => {
      app.get("/ok-obj", (req, res) => res.ok({ test: true }));
      const res = await request(app).get("/ok-obj");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ test: true });
      expect(res.headers["content-type"]).toMatch(/application\/json/);
    });

    it("res.created() should return 201", async () => {
      app.post("/created", (req, res) => res.created({ id: 1 }));
      const res = await request(app).post("/created");
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: 1 });
    });

    it("res.noContent() should return 204 with no body", async () => {
      app.delete("/nocontent", (req, res) => res.noContent());
      const res = await request(app).delete("/nocontent");
      expect(res.status).toBe(204);
      expect(res.text).toBe("");
    });
  });

  describe("Error methods", () => {
    it("res.badRequest() should return 400 and format string as { error }", async () => {
      app.get("/400", (req, res) => res.badRequest("Invalid input"));
      const res = await request(app).get("/400");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid input" });
    });

    it("res.unauthorized() should return 401", async () => {
      app.get("/401", (req, res) => res.unauthorized("Login required"));
      const res = await request(app).get("/401");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Login required" });
    });

    it("res.forbidden() should return 403", async () => {
      app.get("/403", (req, res) => res.forbidden({ reason: "Admin only" }));
      const res = await request(app).get("/403");
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ reason: "Admin only" });
    });

    it("res.notFound() should return 404", async () => {
      app.get("/404", (req, res) => res.notFound("User not found"));
      const res = await request(app).get("/404");
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });
    });

    it("res.conflict() should return 409", async () => {
      app.get("/409", (req, res) => res.conflict("Already exists"));
      const res = await request(app).get("/409");
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: "Already exists" });
    });

    it("res.error() should return custom status or default to 500", async () => {
      app.get("/500", (req, res) => res.error("Server down"));
      app.get("/custom", (req, res) => res.error("Teapot", 418));

      const res1 = await request(app).get("/500");
      expect(res1.status).toBe(500);
      expect(res1.body).toEqual({ error: "Server down" });

      const res2 = await request(app).get("/custom");
      expect(res2.status).toBe(418);
      expect(res2.body).toEqual({ error: "Teapot" });
    });
  });

  describe("Registration guard", () => {
    it("should not duplicate middleware on re-registration", async () => {
      const app2 = createApp();
      app2.useResponseHelpers();
      app2.useResponseHelpers(); // Second call should be a no-op
      
      app2.get("/test", (req, res) => res.ok("ok"));
      const res = await request(app2).get("/test");
      expect(res.status).toBe(200);
    });

    it("should return app for chaining", () => {
      const chainApp = createApp();
      const result = chainApp.useResponseHelpers();
      expect(result).toBe(chainApp);
    });
  });
});
