// Type-level tests for `app.resource`, the method shortcuts and plugins.
// Checked by `pnpm typecheck`, never run.
import { expectTypeOf } from "vitest";
import { createKaelum, k, type Logger, type Middleware, type Plugin } from "../../src/index.js";

const app = createKaelum();
declare const auth: Middleware;

// --- resource: collection actions get the path, item actions get `:id` -------
app.resource("/orgs/:orgId/users", {
  use: [auth],
  list: (c) => {
    expectTypeOf(c.params).toEqualTypeOf<{ orgId: string }>();
    return [];
  },
  create: {
    body: k.object({ name: k.string() }),
    handler: (c) => {
      expectTypeOf(c.params).toEqualTypeOf<{ orgId: string }>();
      expectTypeOf(c.body).toEqualTypeOf<{ name: string }>();
      return c.created();
    },
  },
  get: (c) => {
    expectTypeOf(c.params).toEqualTypeOf<{ orgId: string; id: string }>();
    return null;
  },
  update: {
    body: k.object({ name: k.string().optional() }),
    handler: (c) => {
      expectTypeOf(c.params).toEqualTypeOf<{ orgId: string; id: string }>();
      expectTypeOf(c.body.name).toEqualTypeOf<string | undefined>();
    },
  },
  replace: (c) => c.params.id,
  remove: (c) => {
    expectTypeOf(c.params.id).toBeString();
    return c.noContent();
  },
});

app.resource("/x", {
  // @ts-expect-error -- "index" is not a resource action
  index: () => [],
});

app.resource("/x", {
  // @ts-expect-error -- `orgId` is not in the path
  list: (c) => c.params.orgId,
});

// --- shortcuts ------------------------------------------------------------------
app.get("/users/:id", (c) => {
  expectTypeOf(c.params).toEqualTypeOf<{ id: string }>();
  expectTypeOf(c.log).toEqualTypeOf<Logger>();
  return c.params.id;
});

app.post("/users", {
  use: [auth],
  body: k.object({ age: k.number() }),
  handler: (c) => {
    expectTypeOf(c.body).toEqualTypeOf<{ age: number }>();
  },
});

// @ts-expect-error -- `name` is not a path param
app.delete("/users/:id", (c) => c.params.name);

// --- plugins --------------------------------------------------------------------
declare const withOptions: Plugin<{ path: string }>;
declare const withOptionalOptions: Plugin<{ path?: string } | undefined>;
declare const plain: Plugin;

app.plugin(withOptions, { path: "/x" });
app.plugin(withOptionalOptions);
app.plugin(withOptionalOptions, { path: "/x" });
app.plugin(plain);

// @ts-expect-error -- options are required
app.plugin(withOptions);
// @ts-expect-error -- wrong option type
app.plugin(withOptions, { path: 1 });
