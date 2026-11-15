import type { RequestHandler } from "express";
import request from "supertest";
import { z } from "zod";
import { createKaelum, type Kaelum, type StandardSchemaV1 } from "../src/index.js";

/** A hand-written Standard Schema, to test the contract without any library. */
function schema<T>(check: (value: unknown) => T | { issues: StandardSchemaV1.Issue[] }): StandardSchemaV1<unknown, T> {
  return {
    "~standard": {
      version: 1,
      vendor: "test",
      validate: (value) => {
        const result = check(value);
        return typeof result === "object" && result !== null && "issues" in result
          ? { issues: result.issues }
          : { value: result as T };
      },
    },
  };
}

describe("endpoint schemas", () => {
  let app: Kaelum;

  beforeEach(() => {
    app = createKaelum();
  });

  describe("with Zod", () => {
    const User = z.object({ name: z.string().min(2), role: z.enum(["admin", "user"]).default("user") });

    test("valid body reaches the handler as the schema's output", async () => {
      app.route("/users", {
        post: { body: User, handler: (c) => c.created(c.body) },
      });

      const res = await request(app.express).post("/users").send({ name: "Ada", extra: "dropped" });

      expect(res.status).toBe(201);
      // default applied and unknown key stripped: c.body is the parsed value, not the raw one
      expect(res.body).toEqual({ name: "Ada", role: "user" });
    });

    test("invalid body is a 400 listing every issue, and the handler does not run", async () => {
      const handler = vi.fn();
      app.route("/users", { post: { body: User, handler } });

      const res = await request(app.express).post("/users").send({ name: "A", role: "root" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toBe("Validation failed");
      expect(res.body.error.details.issues).toEqual([
        { source: "body", path: "name", message: expect.any(String) },
        { source: "body", path: "role", message: expect.any(String) },
      ]);
      expect(handler).not.toHaveBeenCalled();
    });

    test("missing body is reported against the body itself", async () => {
      app.route("/users", { post: { body: User, handler: (c) => c.body } });

      const res = await request(app.express).post("/users");

      expect(res.status).toBe(400);
      expect(res.body.error.details.issues[0]).toMatchObject({ source: "body", path: "" });
    });

    test("query is coerced by the schema", async () => {
      app.route("/search", {
        get: {
          query: z.object({ page: z.coerce.number().int().min(1), tag: z.string().optional() }),
          handler: (c) => ({ page: c.query.page, type: typeof c.query.page }),
        },
      });

      const ok = await request(app.express).get("/search?page=3&tag=x");
      expect(ok.body).toEqual({ page: 3, type: "number" });

      // a repeated key arrives as an array, which the schema rejects
      const bad = await request(app.express).get("/search?page=0&tag=x&tag=y");
      expect(bad.status).toBe(400);
      expect(bad.body.error.details.issues).toEqual([
        { source: "query", path: "page", message: expect.any(String) },
        { source: "query", path: "tag", message: expect.any(String) },
      ]);
    });

    test("nested body fields are reported with a dotted path", async () => {
      app.route("/orders", {
        post: {
          body: z.object({ items: z.array(z.object({ sku: z.string() })) }),
          handler: (c) => c.body,
        },
      });

      const res = await request(app.express).post("/orders").send({ items: [{ sku: "a" }, { sku: 2 }] });

      expect(res.body.error.details.issues).toEqual([
        { source: "body", path: "items.1.sku", message: expect.any(String) },
      ]);
    });

    test("params schema replaces c.params with its output", async () => {
      app.route("/users/:id", {
        get: {
          params: z.object({ id: z.coerce.number().int() }),
          handler: (c) => ({ id: c.params.id, type: typeof c.params.id }),
        },
      });

      expect((await request(app.express).get("/users/42")).body).toEqual({ id: 42, type: "number" });
      expect((await request(app.express).get("/users/abc")).status).toBe(400);
    });

    test("issues from params, query and body come together, in that order", async () => {
      app.route("/orgs/:orgId/users", {
        post: {
          params: z.object({ orgId: z.uuid() }),
          query: z.object({ notify: z.enum(["yes", "no"]) }),
          body: User,
          handler: (c) => c.body,
        },
      });

      const res = await request(app.express).post("/orgs/nope/users?notify=maybe").send({ name: "" });

      expect(res.body.error.details.issues.map((i: { source: string }) => i.source)).toEqual([
        "params",
        "query",
        "body",
      ]);
    });
  });

  describe("with any Standard Schema", () => {
    test("sync and async validators both work", async () => {
      const upper = schema((value) => String((value as { text?: unknown }).text).toUpperCase());
      const asyncSchema: StandardSchemaV1<unknown, { ok: true }> = {
        "~standard": {
          version: 1,
          vendor: "test",
          validate: async () => ({ value: { ok: true } }),
        },
      };

      app.route("/sync", { post: { body: upper, handler: (c) => c.body } });
      app.route("/async", { post: { body: asyncSchema, handler: (c) => c.body } });

      expect((await request(app.express).post("/sync").send({ text: "hi" })).text).toBe("HI");
      expect((await request(app.express).post("/async").send({})).body).toEqual({ ok: true });
    });

    test("issue paths accept plain keys and { key } segments", async () => {
      const failing = schema(() => ({
        issues: [
          { message: "bad item", path: ["items", 0, { key: "name" }] },
          { message: "bad root" },
        ],
      }));
      app.route("/x", { post: { body: failing, handler: () => "unreachable" } });

      const res = await request(app.express).post("/x").send({});

      expect(res.body.error.details.issues).toEqual([
        { source: "body", path: "items.0.name", message: "bad item" },
        { source: "body", path: "", message: "bad root" },
      ]);
    });

    test("a schema that returns a falsy value still replaces the raw input", async () => {
      const toNull = schema(() => null);
      app.route("/null", { post: { body: toNull, handler: (c) => ({ body: c.body }) } });

      expect((await request(app.express).post("/null").send({ a: 1 })).body).toEqual({ body: null });
    });

    test("a validator that throws is a 500, not a validation error", async () => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      const broken = schema(() => {
        throw new Error("schema bug");
      });
      app.route("/broken", { post: { body: broken, handler: () => "unreachable" } });

      expect((await request(app.express).post("/broken").send({})).status).toBe(500);
      log.mockRestore();
    });
  });

  describe("order and scope", () => {
    test("middleware runs before validation, so auth can reject first", async () => {
      const validate = vi.fn((value: unknown) => value);
      const deny: RequestHandler = (_req, res) => void res.status(401).end();

      app.route("/secure", {
        post: { use: [deny], body: schema(validate), handler: () => "unreachable" },
      });

      expect((await request(app.express).post("/secure").send({})).status).toBe(401);
      expect(validate).not.toHaveBeenCalled();
    });

    test("endpoints without schemas keep the raw input", async () => {
      app.route("/raw/:id", {
        post: (c) => ({ params: c.params, query: c.query, body: c.body }),
      });

      const res = await request(app.express).post("/raw/7?x=1").send({ any: "thing" });

      expect(res.body).toEqual({ params: { id: "7" }, query: { x: "1" }, body: { any: "thing" } });
    });
  });

  describe("invalid declarations", () => {
    const invalid = (endpoint: unknown) => () => app.route("/x", { post: endpoint } as never);

    test("schema that is not a Standard Schema", () => {
      expect(invalid({ body: { type: "string" }, handler: () => 1 })).toThrow(
        /POST \/x: "body" must be a Standard Schema/
      );
    });

    test("unknown endpoint key", () => {
      expect(invalid({ bodyy: z.string(), handler: () => 1 })).toThrow(/unknown endpoint key "bodyy"/);
    });
  });
});
