// Type-level tests for the route tree. Checked by `pnpm typecheck`, never run.
// Every `@ts-expect-error` below is a mistake that must stay a compile error.
import { expectTypeOf } from "vitest";
import { kaelum, k, type Context, type Kaelum, type Middleware, type ParamsOf } from "../../src/index.js";

const app = kaelum();
declare const auth: Middleware;

// --- ParamsOf ---------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- a path without params really has none
expectTypeOf<ParamsOf<"/users">>().toEqualTypeOf<{}>();
expectTypeOf<ParamsOf<"/users/:id">>().toEqualTypeOf<{ id: string }>();
expectTypeOf<ParamsOf<"/orgs/:orgId/users/:userId">>().toEqualTypeOf<{ orgId: string; userId: string }>();
expectTypeOf<ParamsOf<string>>().toEqualTypeOf<Record<string, string>>();

// --- params come from the path of every enclosing level ----------------------
app.route("/orgs/:orgId", {
  use: [auth],

  get: async (c) => {
    expectTypeOf(c).toEqualTypeOf<Context<"/orgs/:orgId">>();
    expectTypeOf(c.params).toEqualTypeOf<{ orgId: string }>();
    return { id: c.params.orgId };
  },

  "/users": {
    get: (c) => {
      expectTypeOf(c.params).toEqualTypeOf<{ orgId: string }>();
      return [];
    },
    post: {
      use: [auth],
      handler: async (c) => {
        expectTypeOf(c.params).toEqualTypeOf<{ orgId: string }>();
        expectTypeOf(c.body).toBeUnknown();
        return c.created();
      },
    },

    "/:userId": {
      use: [auth],
      delete: (c) => {
        expectTypeOf(c.params).toEqualTypeOf<{ orgId: string; userId: string }>();
        return c.noContent();
      },

      "/posts/:postId/comments/:commentId": {
        get: (c) => {
          expectTypeOf(c.params).toEqualTypeOf<{
            orgId: string;
            userId: string;
            postId: string;
            commentId: string;
          }>();
          return c.params.commentId;
        },
      },
    },
  },
});

// --- routes in their own module: a function that receives the app ---------
export default function userRoutes(target: Kaelum) {
  target.route("/orgs/:orgId/users/:userId", {
    get: (c) => {
      expectTypeOf(c.params).toEqualTypeOf<{ orgId: string; userId: string }>();
      return c.params.userId;
    },
  });
}

// --- an endpoint object with a schema next to a nested path with handlers ---
// (regression: an overload on app.route made c lose its type in this shape)
app.route("/accounts", {
  get: () => [],
  post: {
    body: k.object({ name: k.string() }),
    handler: (c) => {
      expectTypeOf(c.body).toEqualTypeOf<{ name: string }>();
      return c.created(c.body);
    },
  },
  "/:id": {
    get: (c) => {
      expectTypeOf(c.params).toEqualTypeOf<{ id: string }>();
      return c.params.id;
    },
  },
});

// --- mistakes that must not compile -----------------------------------------
app.route("/users", {
  // @ts-expect-error unknown key (typo in the HTTP method)
  gett: () => 1,
});

app.route("/users", {
  "/:id": {
    get: (c) => {
      // @ts-expect-error param that is not in the path
      return c.params.slug;
    },
  },
});

app.route("/users", {
  // @ts-expect-error endpoint object without a handler
  post: { use: [auth] },
});

app.route("/users", {
  // @ts-expect-error `use` must be an array of middleware
  use: auth,
});

// Known gap: `{ "/:id": handler }` (a handler where a tree is expected) compiles.
// It throws when the route is registered; see the comment on `Shape`.
