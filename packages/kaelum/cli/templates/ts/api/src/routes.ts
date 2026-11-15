import * as users from "./controllers/usersController";
import { authMock } from "./middlewares/authMock";
import { validate } from "kaelum/validate";

// Request body validation for POST /users
const createUserSchema = validate({
  body: {
    name: { type: "string", required: true, min: 2, max: 50 },
    role: { type: "string" },
  },
});

const routes = (app: any): void => {
  // Global middleware for /users path
  app.setMiddleware("/users", (req: any, res: any, next: any) => {
    // Require auth on POST requests
    if (req.method === "POST") return authMock(req, res, next);
    next();
  });

  // RESTful nested routing example
  app.apiRoute("users", {
    get: users.list,
    post: [createUserSchema, users.create],

    // Nested parameter: /users/:id
    "/:id": {
      get: users.getById,

      // Nested resource: /users/:id/posts
      "/posts": {
        get: users.posts,
      },
    },
  });

  // Metadata endpoint
  app.addRoute("/meta", {
    get: (req: any, res: any) => res.ok({ framework: "Kaelum" }),
  });
};

export { routes };
