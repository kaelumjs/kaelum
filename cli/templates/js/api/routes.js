// routes.js
const users = require("./controllers/usersController");
const auth = require("./middlewares/authMock");

module.exports = (app) => {
  // Global middleware for /users path
  app.setMiddleware("/users", (req, res, next) => {
    // Require auth on POST requests
    if (req.method === "POST") return auth(req, res, next);
    next();
  });

  // RESTful nested routing example
  app.apiRoute("users", {
    get: users.list,
    post: users.create,

    // Nested parameter: /users/:id
    "/:id": {
      get: users.get,

      // Nested resource: /users/:id/posts
      "/posts": {
        get: users.posts,
      },
    },
  });

  // Metadata endpoint
  app.addRoute("/meta", {
    get: (req, res) => res.json({ version: "1.8.0", framework: "Kaelum" }),
  });
};
