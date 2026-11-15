// Type-level tests for endpoint schemas. Checked by `pnpm typecheck`, never run.
import { expectTypeOf } from "vitest";
import { z } from "zod";
import { createKaelum, type Middleware, type StandardSchemaV1 } from "../../src/index.js";

const app = createKaelum();
declare const auth: Middleware;

const User = z.object({ name: z.string(), role: z.enum(["admin", "user"]).default("user") });
const Paging = z.object({ page: z.coerce.number() });
declare const Handwritten: StandardSchemaV1<unknown, { ok: true }>;

app.route("/orgs/:orgId/users", {
  // body schema types c.body with the schema's *output* (defaults applied)
  post: {
    body: User,
    use: [auth],
    handler: async (c) => {
      expectTypeOf(c.body).toEqualTypeOf<{ name: string; role: "admin" | "user" }>();
      expectTypeOf(c.params).toEqualTypeOf<{ orgId: string }>();
      return c.created(c.body);
    },
  },

  // query schema types c.query; body stays unknown
  get: {
    query: Paging,
    handler: (c) => {
      expectTypeOf(c.query).toEqualTypeOf<{ page: number }>();
      expectTypeOf(c.body).toBeUnknown();
      return c.query.page;
    },
  },

  "/:userId": {
    // params schema replaces the params inferred from the path
    get: {
      params: z.object({ orgId: z.string(), userId: z.coerce.number() }),
      handler: (c) => {
        expectTypeOf(c.params).toEqualTypeOf<{ orgId: string; userId: number }>();
        return c.params.userId;
      },
    },

    // all three at once
    put: {
      params: z.object({ userId: z.coerce.number() }),
      query: Paging,
      body: User,
      handler: (c) => {
        expectTypeOf(c.params).toEqualTypeOf<{ userId: number }>();
        expectTypeOf(c.query).toEqualTypeOf<{ page: number }>();
        expectTypeOf(c.body).toEqualTypeOf<{ name: string; role: "admin" | "user" }>();
        return c.noContent();
      },
    },

    // no schema: raw input types
    delete: {
      use: [auth],
      handler: (c) => {
        expectTypeOf(c.params).toEqualTypeOf<{ orgId: string; userId: string }>();
        expectTypeOf(c.body).toBeUnknown();
        return c.noContent();
      },
    },
  },
});

// any Standard Schema works, not only Zod
app.route("/plain", {
  post: {
    body: Handwritten,
    handler: (c) => {
      expectTypeOf(c.body).toEqualTypeOf<{ ok: true }>();
      return c.body;
    },
  },
});

// --- mistakes that must not compile -----------------------------------------
app.route("/users", {
  post: {
    body: User,
    handler: (c) => {
      // @ts-expect-error field that is not in the body schema
      return c.body.email;
    },
  },
});

app.route("/users", {
  get: {
    query: Paging,
    handler: (c) => {
      // @ts-expect-error page is a number after coercion, not a string
      return c.query.page.toUpperCase();
    },
  },
});

app.route("/users", {
  post: {
    // @ts-expect-error a plain object is not a schema
    body: { name: "string" },
    handler: (): number => 1,
  },
});
