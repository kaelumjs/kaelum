import { k } from "kaelum";
import { requireApiKey } from "../middlewares/auth.js";

// In-memory data, to keep the example self-contained.
const users = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "user" },
];

const NewUser = k.object({
  name: k.string().min(2).max(50),
  role: k.enum(["admin", "user"]).default("user"),
});

export default function userRoutes(app) {
  app.route("/users", {
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
      get: (c) => users.find((user) => user.id === Number(c.params.id)) ?? c.notFound("User not found"),

      "/posts": {
        get: (c) => [{ id: 101, title: "Hello, Kaelum", userId: Number(c.params.id) }],
      },
    },
  });
}
