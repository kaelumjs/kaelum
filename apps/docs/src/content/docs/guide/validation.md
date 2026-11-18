---
title: Validation
description: Validate and type the body, query and params with any Standard Schema library or the built-in k builder.
sidebar:
  order: 3
---

Give an endpoint a `body`, `query` or `params` schema and Kaelum validates the request before the handler runs. The handler sees the schema's **output**: typed, with defaults applied and unknown keys removed.

```ts
import { k } from "kaelum";

const NewUser = k.object({
  name: k.string().min(2),
  role: k.enum(["admin", "user"]).default("user"),
});

app.route("/users", {
  post: {
    body: NewUser,
    handler: (c) => {
      c.body; // { name: string; role: "admin" | "user" }
      return c.created(db.users.create(c.body));
    },
  },
});
```

## Any schema library

Schemas follow [Standard Schema](https://standardschema.dev), so Zod, Valibot, ArkType and others work without adapters:

```ts
import { z } from "zod";

app.get("/search", {
  query: z.object({ q: z.string(), page: z.coerce.number().default(1) }),
  handler: (c) => search(c.query.q, c.query.page), // c.query.page is a number
});
```

Kaelum does not depend on any of them. Use the one you already have, or the built-in `k`.

## When validation fails

The request is answered with `400` and every problem found, from all sources at once:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "issues": [
        { "source": "body", "path": "name", "message": "Must be at least 2 characters" },
        { "source": "query", "path": "page", "message": "Expected a number" }
      ]
    }
  }
}
```

Sources are checked in the order params, query, body. Nested paths are joined with dots, as in `items.0.price`.

## Query strings and params are strings

Everything in a URL arrives as a string. Use the coercing schemas when you want numbers or booleans:

```ts
app.get("/users/:id", {
  params: k.object({ id: k.coerce.number().int() }),
  handler: (c) => db.users.find(c.params.id), // c.params.id is a number
});
```

## The `k` builder

| Builder | Accepts |
| --- | --- |
| `k.string()` | a string. `.min(n)`, `.max(n)`, `.trim()`, `.pattern(regex)`, `.email()`, `.uuid()`, `.url()` |
| `k.number()` | a number. `.min(n)`, `.max(n)`, `.int()` |
| `k.boolean()` | a boolean |
| `k.enum([...])` | one of the given strings or numbers |
| `k.array(item)` | an array of `item`. `.min(n)`, `.max(n)` |
| `k.object({ ... })` | an object with those fields; other keys are dropped |
| `k.unknown()` | anything except a missing value |
| `k.coerce.number()` | a number or a numeric string |
| `k.coerce.boolean()` | a boolean or `"true"`, `"false"`, `"1"`, `"0"` |

Every schema also has:

| Modifier | Effect |
| --- | --- |
| `.optional()` | also accepts `undefined`; in an object, the key becomes optional |
| `.nullable()` | also accepts `null` |
| `.default(value)` | uses `value` when the input is missing |
| `.refine(rule, message?)` | custom check; `rule` returns `true`, `false` or an error message |

```ts
const Signup = k.object({
  email: k.string().trim().email(),
  password: k.string().min(12),
  username: k.string().refine((v) => v !== "admin" || "That name is reserved"),
  newsletter: k.boolean().default(false),
});
```

Schemas are immutable: every modifier returns a new schema. To get the type of a schema, use `Infer`:

```ts
import type { Infer } from "kaelum";

type Signup = Infer<typeof Signup>;
```

`k` covers request validation. For unions, transforms or recursive types, use a full library such as Zod or Valibot.
