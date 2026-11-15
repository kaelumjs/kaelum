const createApp = require("../../createApp");
const { validate } = require("../../core/validate");
const request = require("supertest");

// Helper: build a minimal app with the validate middleware on POST /test
function makeApp(schema) {
  const app = createApp();
  app.post("/test", validate(schema), (req, res) => {
    res.json({ ok: true, body: req.body, query: req.query });
  });
  return app;
}

describe("core/validate", () => {
  // -------------------------------------------------------------------------
  // Factory guard
  // -------------------------------------------------------------------------
  describe("factory", () => {
    it("should throw if schema is not an object", () => {
      expect(() => validate("bad")).toThrow();
      expect(() => validate(null)).toThrow();
    });

    it("should return a function (middleware)", () => {
      expect(typeof validate({})).toBe("function");
      expect(validate({}).length).toBe(3); // (req, res, next)
    });
  });

  // -------------------------------------------------------------------------
  // required
  // -------------------------------------------------------------------------
  describe("required rule", () => {
    it("should return 400 when a required field is missing", async () => {
      const app = makeApp({ body: { name: { required: true } } });
      const res = await request(app).post("/test").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.fields[0].field).toBe("body.name");
    });

    it("should pass when a required field is present", async () => {
      const app = makeApp({ body: { name: { required: true } } });
      const res = await request(app).post("/test").send({ name: "Alice" });
      expect(res.status).toBe(200);
    });

    it("should pass when an optional field is absent", async () => {
      const app = makeApp({ body: { nickname: { type: "string" } } });
      const res = await request(app).post("/test").send({});
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // type: string
  // -------------------------------------------------------------------------
  describe("type: string", () => {
    it("should pass for a valid string", async () => {
      const app = makeApp({ body: { name: { type: "string" } } });
      const res = await request(app).post("/test").send({ name: "Alice" });
      expect(res.status).toBe(200);
    });

    it("should return 400 when a number is given for a string field", async () => {
      const app = makeApp({ body: { name: { type: "string" } } });
      const res = await request(app).post("/test").send({ name: 42 });
      expect(res.status).toBe(400);
      expect(res.body.fields[0].message).toMatch(/string/);
    });
  });

  // -------------------------------------------------------------------------
  // type: number
  // -------------------------------------------------------------------------
  describe("type: number", () => {
    it("should pass for a valid number", async () => {
      const app = makeApp({ body: { age: { type: "number" } } });
      const res = await request(app).post("/test").send({ age: 25 });
      expect(res.status).toBe(200);
    });

    it("should return 400 when a non-numeric string is given", async () => {
      const app = makeApp({ body: { age: { type: "number" } } });
      const res = await request(app).post("/test").send({ age: "abc" });
      expect(res.status).toBe(400);
    });

    it("should coerce numeric string from query", async () => {
      const app = createApp();
      app.get("/test", validate({ query: { page: { type: "number", min: 1 } } }), (req, res) =>
        res.json({ ok: true })
      );
      const res = await request(app).get("/test?page=2");
      expect(res.status).toBe(200);
    });

    it("should return 400 for non-numeric query value", async () => {
      const app = createApp();
      app.get("/test", validate({ query: { page: { type: "number" } } }), (req, res) =>
        res.json({ ok: true })
      );
      const res = await request(app).get("/test?page=abc");
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // type: boolean
  // -------------------------------------------------------------------------
  describe("type: boolean", () => {
    it("should pass for a native boolean", async () => {
      const app = makeApp({ body: { active: { type: "boolean" } } });
      const res = await request(app).post("/test").send({ active: true });
      expect(res.status).toBe(200);
    });

    it("should coerce 'true'/'false' strings in query", async () => {
      const app = createApp();
      app.get("/test", validate({ query: { active: { type: "boolean" } } }), (req, res) =>
        res.json({ ok: true })
      );
      const res = await request(app).get("/test?active=true");
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // type: array
  // -------------------------------------------------------------------------
  describe("type: array", () => {
    it("should pass for an array", async () => {
      const app = makeApp({ body: { tags: { type: "array" } } });
      const res = await request(app).post("/test").send({ tags: ["a", "b"] });
      expect(res.status).toBe(200);
    });

    it("should return 400 when an object is given for an array field", async () => {
      const app = makeApp({ body: { tags: { type: "array" } } });
      const res = await request(app).post("/test").send({ tags: {} });
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // min / max
  // -------------------------------------------------------------------------
  describe("min / max rules", () => {
    it("should return 400 when string is shorter than min", async () => {
      const app = makeApp({ body: { name: { type: "string", min: 3 } } });
      const res = await request(app).post("/test").send({ name: "ab" });
      expect(res.status).toBe(400);
      expect(res.body.fields[0].message).toMatch(/3 characters/);
    });

    it("should return 400 when string is longer than max", async () => {
      const app = makeApp({ body: { name: { type: "string", max: 5 } } });
      const res = await request(app).post("/test").send({ name: "toolongname" });
      expect(res.status).toBe(400);
    });

    it("should return 400 when number is below min", async () => {
      const app = makeApp({ body: { age: { type: "number", min: 18 } } });
      const res = await request(app).post("/test").send({ age: 10 });
      expect(res.status).toBe(400);
      expect(res.body.fields[0].message).toMatch(/18/);
    });

    it("should return 400 when number exceeds max", async () => {
      const app = makeApp({ body: { score: { type: "number", max: 100 } } });
      const res = await request(app).post("/test").send({ score: 150 });
      expect(res.status).toBe(400);
    });

    it("should return 400 when array has fewer items than min", async () => {
      const app = makeApp({ body: { tags: { type: "array", min: 2 } } });
      const res = await request(app).post("/test").send({ tags: ["a"] });
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // pattern presets
  // -------------------------------------------------------------------------
  describe("pattern presets", () => {
    it("should pass for a valid email", async () => {
      const app = makeApp({ body: { email: { type: "string", pattern: "email" } } });
      const res = await request(app).post("/test").send({ email: "user@example.com" });
      expect(res.status).toBe(200);
    });

    it("should return 400 for an invalid email", async () => {
      const app = makeApp({ body: { email: { type: "string", pattern: "email" } } });
      const res = await request(app).post("/test").send({ email: "not-an-email" });
      expect(res.status).toBe(400);
      expect(res.body.fields[0].message).toMatch(/email/);
    });

    it("should validate url preset", async () => {
      const app = makeApp({ body: { site: { type: "string", pattern: "url" } } });
      const ok = await request(app).post("/test").send({ site: "https://kaelumjs.matthcodes.dev" });
      const fail = await request(app).post("/test").send({ site: "not-a-url" });
      expect(ok.status).toBe(200);
      expect(fail.status).toBe(400);
    });

    it("should validate uuid preset", async () => {
      const app = makeApp({ body: { id: { type: "string", pattern: "uuid" } } });
      const ok = await request(app).post("/test").send({ id: "550e8400-e29b-41d4-a716-446655440000" });
      const fail = await request(app).post("/test").send({ id: "not-a-uuid" });
      expect(ok.status).toBe(200);
      expect(fail.status).toBe(400);
    });

    it("should validate alphanumeric preset", async () => {
      const app = makeApp({ body: { code: { type: "string", pattern: "alphanumeric" } } });
      const ok = await request(app).post("/test").send({ code: "abc123" });
      const fail = await request(app).post("/test").send({ code: "abc 123!" });
      expect(ok.status).toBe(200);
      expect(fail.status).toBe(400);
    });

    it("should accept a custom RegExp for pattern", async () => {
      const app = makeApp({ body: { code: { type: "string", pattern: /^KL-\d{4}$/ } } });
      const ok = await request(app).post("/test").send({ code: "KL-1234" });
      const fail = await request(app).post("/test").send({ code: "KL-12" });
      expect(ok.status).toBe(200);
      expect(fail.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // custom validator
  // -------------------------------------------------------------------------
  describe("custom validator", () => {
    it("should pass when custom returns true", async () => {
      const app = makeApp({
        body: { score: { custom: (v) => v % 2 === 0 || "Must be even" } },
      });
      const res = await request(app).post("/test").send({ score: 4 });
      expect(res.status).toBe(200);
    });

    it("should return 400 with custom message when custom returns a string", async () => {
      const app = makeApp({
        body: { score: { custom: (v) => v % 2 === 0 || "Must be even" } },
      });
      const res = await request(app).post("/test").send({ score: 3 });
      expect(res.status).toBe(400);
      expect(res.body.fields[0].message).toBe("Must be even");
    });
  });

  // -------------------------------------------------------------------------
  // Multiple targets
  // -------------------------------------------------------------------------
  describe("multiple targets", () => {
    it("should validate body and query simultaneously", async () => {
      const app = createApp();
      app.post(
        "/test",
        validate({
          body: { name: { type: "string", required: true } },
          query: { page: { type: "number", min: 1 } },
        }),
        (req, res) => res.json({ ok: true })
      );

      // valid
      const ok = await request(app).post("/test?page=2").send({ name: "Alice" });
      expect(ok.status).toBe(200);

      // missing body.name + bad query.page
      const fail = await request(app).post("/test?page=abc").send({});
      expect(fail.status).toBe(400);
      expect(fail.body.fields.length).toBeGreaterThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  // Error aggregation
  // -------------------------------------------------------------------------
  describe("error aggregation", () => {
    it("should collect ALL errors before responding", async () => {
      const app = makeApp({
        body: {
          name: { type: "string", required: true },
          email: { type: "string", pattern: "email" },
          age: { type: "number", min: 18 },
        },
      });
      const res = await request(app)
        .post("/test")
        .send({ email: "bad", age: 5 });

      expect(res.status).toBe(400);
      // name (required) + email (pattern) + age (min) = 3 errors
      expect(res.body.fields.length).toBe(3);
    });
  });
});
