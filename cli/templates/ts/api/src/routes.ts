import * as users from "./controllers/usersController";
import { authMock } from "./middlewares/authMock";

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
    post: users.create,

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
    get: (req: any, res: any) =>
      res.json({ framework: "Kaelum" }),
  });
};

export { routes };
