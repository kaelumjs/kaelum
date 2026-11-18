import { defineRoutes, k } from "kaelum";
import { requireApiKey } from "../middlewares/auth.ts";

interface User {
  id: number;
  name: string;
  role: "admin" | "user";
}

// In-memory data, to keep the example self-contained.
const users: User[] = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "user" },
];

const NewUser = k.object({
  name: k.string().min(2).max(50),
  role: k.enum(["admin", "user"]).default("user"),
});

// Every handler gets `c`: typed params, validated body, response helpers.
export const userRoutes = defineRoutes("/users")({
  get: () => users,

  post: {
    use: [requireApiKey],
    body: NewUser,
    handler: (c) => {
      const user = { id: users.length + 1, ...c.body };
      users.push(user);
      return c.created(user);
    },
  },

  "/:id": {
    get: (c) => {
      const user = users.find((u) => u.id === Number(c.params.id));
      return user ?? c.notFound("User not found");
    },

    // Nested route: GET /users/:id/posts
    "/posts": {
      get: (c) => [
        { id: 101, title: "Hello, Kaelum", userId: Number(c.params.id) },
        { id: 102, title: "Route trees", userId: Number(c.params.id) },
      ],
    },
  },
});
