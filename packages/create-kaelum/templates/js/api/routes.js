// routes.js
const users = require("./controllers/usersController");
const auth = require("./middlewares/authMock");
const { validate } = require("kaelum/validate");
const { version } = require("./package.json");

// Request body validation for POST /users
const createUserSchema = validate({
  body: {
    name: { type: "string", required: true, min: 2, max: 50 },
    role: { type: "string" },
  },
});

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
    post: [createUserSchema, users.create],

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
    get: (req, res) => res.ok({ version, framework: "Kaelum" }),
  });
};
