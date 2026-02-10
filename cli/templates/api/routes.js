// routes.js
const users = require("./controllers/usersController");
const auth = require("./middlewares/authMock");

module.exports = (app) => {
  // Global middleware for /users path
  app.setMiddleware("/users", (req, res, next) => {
    // Simple method check
    if (req.method === "POST") return auth(req, res, next);
    next();
  });

  // Recursive Nested Routing Example
  app.apiRoute("users", {
    get: users.list,   // GET /users
    post: users.create, // POST /users (protected by middleware above)

    // Nested parameter: /users/:id
    "/:id": {
      get: users.get, // GET /users/:id

      // Nested resource: /users/:id/posts
      "/posts": {
        get: users.posts, // GET /users/:id/posts
      },
    },
  });

  // Metadata endpoint
  app.addRoute("/meta", {
    get: (req, res) => res.json({ version: "1.4.2", framework: "Kaelum" }),
  });
};
