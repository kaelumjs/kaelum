// Type-level tests for the `k` schema builder. Checked by `pnpm typecheck`, never run.
import { expectTypeOf } from "vitest";
import { kaelum, k, type Infer, type InferOutput } from "../../src/index.js";

// --- primitives and modifiers -------------------------------------------------
expectTypeOf<Infer<ReturnType<typeof k.string>>>().toEqualTypeOf<string>();
expectTypeOf<Infer<ReturnType<typeof k.coerce.number>>>().toEqualTypeOf<number>();

const Role = k.enum(["admin", "user"]);
expectTypeOf<Infer<typeof Role>>().toEqualTypeOf<"admin" | "user">();

const maybe = k.string().min(2).optional();
expectTypeOf<Infer<typeof maybe>>().toEqualTypeOf<string | undefined>();

const nullable = k.number().nullable();
expectTypeOf<Infer<typeof nullable>>().toEqualTypeOf<number | null>();

const withDefault = k.boolean().default(false);
expectTypeOf<Infer<typeof withDefault>>().toEqualTypeOf<boolean>();

const tags = k.array(k.string());
expectTypeOf<Infer<typeof tags>>().toEqualTypeOf<string[]>();

// --- objects: fields that accept undefined become optional keys ---------------
const User = k.object({
  name: k.string(),
  age: k.number().optional(),
  role: Role.default("user"),
  address: k.object({ zip: k.string(), line2: k.string().nullable() }).optional(),
  tags,
});

expectTypeOf<Infer<typeof User>>().toEqualTypeOf<{
  name: string;
  role: "admin" | "user";
  tags: string[];
  age?: number | undefined;
  address?: { zip: string; line2: string | null } | undefined;
}>();

// Standard Schema's own helper agrees with `Infer`
expectTypeOf<InferOutput<typeof User>>().toEqualTypeOf<Infer<typeof User>>();

// --- in a route, the same as any other Standard Schema ------------------------
const app = kaelum();

app.route("/users/:id", {
  put: {
    params: k.object({ id: k.coerce.number() }),
    query: k.object({ notify: k.coerce.boolean().default(false) }),
    body: User,
    handler: (c) => {
      expectTypeOf(c.params).toEqualTypeOf<{ id: number }>();
      expectTypeOf(c.query).toEqualTypeOf<{ notify: boolean }>();
      expectTypeOf(c.body).toEqualTypeOf<Infer<typeof User>>();
      return c.body.name;
    },
  },
});

// --- mistakes that must not compile -------------------------------------------
// @ts-expect-error the default must match the schema's type
k.number().default("1");

// @ts-expect-error string rules do not exist on numbers
k.number().email();

app.route("/users", {
  post: {
    body: User,
    handler: (c) => {
      // @ts-expect-error age may be undefined
      return c.body.age.toFixed();
    },
  },
});
