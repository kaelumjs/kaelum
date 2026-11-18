import request from "supertest";
import { kaelum, k, type StandardSchemaV1 } from "../src/index.js";

type AnySchema = StandardSchemaV1;

/** Run a schema the way Kaelum does and flatten the result for assertions. */
function run(schema: AnySchema, value: unknown) {
  const result = schema["~standard"].validate(value) as
    | { value: unknown; issues?: undefined }
    | { issues: ReadonlyArray<{ message: string; path?: ReadonlyArray<PropertyKey | { key: PropertyKey }> }> };

  if (result.issues) {
    return { ok: false as const, issues: result.issues.map((i) => `${(i.path ?? []).join(".")}: ${i.message}`) };
  }
  return { ok: true as const, value: result.value };
}

const valid = (schema: AnySchema, value: unknown) => {
  const result = run(schema, value);
  expect(result.ok, JSON.stringify(result)).toBe(true);
  return (result as { value: unknown }).value;
};
const issues = (schema: AnySchema, value: unknown) => {
  const result = run(schema, value);
  expect(result.ok).toBe(false);
  return (result as { issues: string[] }).issues;
};

describe("k schema builder", () => {
  test("identifies itself as a Standard Schema", () => {
    expect(k.string()["~standard"]).toMatchObject({ version: 1, vendor: "kaelum" });
  });

  describe("string", () => {
    test("type and required", () => {
      expect(valid(k.string(), "hi")).toBe("hi");
      expect(valid(k.string(), "")).toBe("");
      expect(issues(k.string(), 1)).toEqual([": Expected a string"]);
      expect(issues(k.string(), undefined)).toEqual([": Required"]);
      expect(issues(k.string(), null)).toEqual([": Expected a string"]);
    });

    test("min, max and pluralized messages", () => {
      expect(issues(k.string().min(2), "a")).toEqual([": Must be at least 2 characters"]);
      expect(issues(k.string().min(1), "")).toEqual([": Must be at least 1 character"]);
      expect(issues(k.string().max(3), "abcd")).toEqual([": Must be at most 3 characters"]);
      expect(valid(k.string().min(2).max(3), "abc")).toBe("abc");
    });

    test("email, uuid, url, pattern", () => {
      expect(valid(k.string().email(), "a@b.co")).toBe("a@b.co");
      expect(issues(k.string().email(), "a@b")).toEqual([": Must be a valid email"]);
      expect(valid(k.string().uuid(), "123e4567-e89b-12d3-a456-426614174000")).toBeTruthy();
      expect(issues(k.string().uuid(), "nope")).toEqual([": Must be a valid UUID"]);
      expect(valid(k.string().url(), "https://kaelum.dev/x")).toBeTruthy();
      expect(issues(k.string().url(), "not a url")).toEqual([": Must be a valid URL"]);
      expect(issues(k.string().pattern(/^[a-z]+$/), "ABC")).toEqual([": Invalid format"]);
      expect(issues(k.string().pattern(/^[a-z]+$/, "Lowercase only"), "ABC")).toEqual([": Lowercase only"]);
    });

    test("trim runs before the other rules", () => {
      expect(valid(k.string().trim().min(2), "  ab  ")).toBe("ab");
      expect(issues(k.string().trim().min(2), "  a  ")).toEqual([": Must be at least 2 characters"]);
    });

    test("reports every failed rule", () => {
      expect(issues(k.string().min(5).email(), "a@b")).toEqual([
        ": Must be at least 5 characters",
        ": Must be a valid email",
      ]);
    });
  });

  describe("number and boolean", () => {
    test("number rejects strings, NaN and Infinity unless coerced", () => {
      expect(valid(k.number(), 3.5)).toBe(3.5);
      expect(issues(k.number(), "3")).toEqual([": Expected a number"]);
      expect(issues(k.number(), NaN)).toEqual([": Expected a number"]);
      expect(issues(k.number(), Infinity)).toEqual([": Expected a number"]);
    });

    test("min, max, int", () => {
      expect(issues(k.number().min(1), 0)).toEqual([": Must be at least 1"]);
      expect(issues(k.number().max(10), 11)).toEqual([": Must be at most 10"]);
      expect(issues(k.number().int(), 1.5)).toEqual([": Must be an integer"]);
      expect(valid(k.number().int().min(0).max(120), 42)).toBe(42);
    });

    test("coerce.number accepts numeric strings only", () => {
      expect(valid(k.coerce.number(), "42")).toBe(42);
      expect(valid(k.coerce.number(), " 1.5 ")).toBe(1.5);
      expect(valid(k.coerce.number(), 7)).toBe(7);
      expect(issues(k.coerce.number(), "")).toEqual([": Expected a number"]);
      expect(issues(k.coerce.number(), "abc")).toEqual([": Expected a number"]);
      expect(issues(k.coerce.number().int(), "1.5")).toEqual([": Must be an integer"]);
    });

    test("boolean and coerce.boolean", () => {
      expect(valid(k.boolean(), false)).toBe(false);
      expect(issues(k.boolean(), "true")).toEqual([": Expected a boolean"]);
      expect(valid(k.coerce.boolean(), "true")).toBe(true);
      expect(valid(k.coerce.boolean(), "0")).toBe(false);
      expect(issues(k.coerce.boolean(), "yes")).toEqual([": Expected a boolean"]);
    });
  });

  describe("enum and unknown", () => {
    test("enum accepts only the listed values", () => {
      const Role = k.enum(["admin", "user"]);
      expect(valid(Role, "admin")).toBe("admin");
      expect(issues(Role, "root")).toEqual([": Must be one of: admin, user"]);
    });

    test("unknown accepts anything but a missing value", () => {
      expect(valid(k.unknown(), { any: [1] })).toEqual({ any: [1] });
      expect(valid(k.unknown(), null)).toBeNull();
      expect(issues(k.unknown(), undefined)).toEqual([": Required"]);
    });
  });

  describe("optional, nullable, default", () => {
    test("optional accepts undefined and still validates a present value", () => {
      const schema = k.string().min(2).optional();
      expect(valid(schema, undefined)).toBeUndefined();
      expect(issues(schema, "a")).toEqual([": Must be at least 2 characters"]);
      expect(issues(schema, null)).toEqual([": Expected a string"]);
    });

    test("nullable accepts null but not undefined", () => {
      const schema = k.number().nullable();
      expect(valid(schema, null)).toBeNull();
      expect(valid(schema, 1)).toBe(1);
      expect(issues(schema, undefined)).toEqual([": Required"]);
    });

    test("default fills a missing value and validates a present one", () => {
      const schema = k.enum(["admin", "user"]).default("user");
      expect(valid(schema, undefined)).toBe("user");
      expect(valid(schema, "admin")).toBe("admin");
      expect(issues(schema, "root")).toEqual([": Must be one of: admin, user"]);
    });
  });

  describe("refine", () => {
    test("true accepts, false uses the default message, a string is the message", () => {
      const even = k.number().refine((n) => n % 2 === 0, "Must be even");
      expect(valid(even, 2)).toBe(2);
      expect(issues(even, 3)).toEqual([": Must be even"]);

      expect(issues(k.string().refine(() => false), "x")).toEqual([": Invalid value"]);
      expect(issues(k.string().refine((v) => v !== "admin" || "Reserved"), "admin")).toEqual([": Reserved"]);
    });
  });

  describe("array", () => {
    test("validates every item and reports its index", () => {
      const Tags = k.array(k.string().min(2));
      expect(valid(Tags, ["ab", "cd"])).toEqual(["ab", "cd"]);
      expect(issues(Tags, ["ab", "c", 3])).toEqual([
        "1: Must be at least 2 characters",
        "2: Expected a string",
      ]);
      expect(issues(Tags, "ab")).toEqual([": Expected an array"]);
    });

    test("min and max count items", () => {
      expect(issues(k.array(k.number()).min(1), [])).toEqual([": Must have at least 1 item"]);
      expect(issues(k.array(k.number()).max(2), [1, 2, 3])).toEqual([": Must have at most 2 items"]);
    });
  });

  describe("object", () => {
    const User = k.object({
      name: k.string().min(2),
      age: k.number().int().optional(),
      role: k.enum(["admin", "user"]).default("user"),
      address: k.object({ zip: k.string() }).optional(),
      tags: k.array(k.string()).default([]),
    });

    test("returns only declared keys, with defaults applied", () => {
      expect(valid(User, { name: "Ada", extra: "dropped", __proto__: { polluted: true } })).toEqual({
        name: "Ada",
        role: "user",
        tags: [],
      });
    });

    test("reports every invalid field with its path", () => {
      expect(issues(User, { name: "A", age: 1.5, role: "root", address: {}, tags: ["ok", 1] })).toEqual([
        "name: Must be at least 2 characters",
        "age: Must be an integer",
        "role: Must be one of: admin, user",
        "address.zip: Required",
        "tags.1: Expected a string",
      ]);
    });

    test("rejects non-objects", () => {
      expect(issues(User, null)).toEqual([": Expected an object"]);
      expect(issues(User, [])).toEqual([": Expected an object"]);
      expect(issues(User, "x")).toEqual([": Expected an object"]);
    });
  });

  test("schemas are immutable: builder methods return new schemas", () => {
    const base = k.string();
    const strict = base.min(5);
    const trimmed = base.trim();

    expect(valid(base, "a")).toBe("a");
    expect(issues(strict, "a")).toHaveLength(1);
    expect(valid(base, " a ")).toBe(" a ");
    expect(valid(trimmed, " a ")).toBe("a");
  });

  describe("in a route", () => {
    test("validates body and query, and c gets the parsed values", async () => {
      const app = kaelum();
      app.route("/users", {
        get: {
          query: k.object({ page: k.coerce.number().int().min(1).default(1), active: k.coerce.boolean().optional() }),
          handler: (c) => c.query,
        },
        post: {
          body: k.object({ name: k.string().trim().min(2), email: k.string().email() }),
          handler: (c) => c.created(c.body),
        },
      });

      expect((await request(app.express).get("/users?page=3&active=true")).body).toEqual({ page: 3, active: true });
      expect((await request(app.express).get("/users")).body).toEqual({ page: 1 });

      const created = await request(app.express).post("/users").send({ name: " Ada ", email: "ada@x.io", admin: true });
      expect(created.status).toBe(201);
      expect(created.body).toEqual({ name: "Ada", email: "ada@x.io" });

      const bad = await request(app.express).post("/users").send({ name: "A" });
      expect(bad.status).toBe(400);
      expect(bad.body.error).toEqual({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: {
          issues: [
            { source: "body", path: "name", message: "Must be at least 2 characters" },
            { source: "body", path: "email", message: "Required" },
          ],
        },
      });
    });
  });
});
