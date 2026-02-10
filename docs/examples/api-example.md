# API Template Guide

The **API Template** is designed for building RESTful services quickly. It includes a pre-configured setup with security best practices, logging, and an organized MVC-like structure.

To generate an API project:

```bash
npx kaelum create my-api --template api
```

## Project Structure

The generated project has the following layout:

```text
my-api/
├── controllers/          # Request handlers (logic)
│   └── usersController.js
├── middlewares/          # Custom middleware
│   └── authMock.js
├── app.js                # Application entry point & configuration
├── routes.js             # Route definitions
└── package.json
```

## Key Files Explained

### 1. `app.js`

This file initializes the Kaelum app and sets up global configurations.

```js
const kaelum = require("kaelum");
const app = kaelum();

// 1. Configure global settings
app.setConfig({
  cors: true,       // Enable CORS for cross-origin requests
  helmet: true,     // Add security headers
  logs: true,       // Log requests to console (morgan)
  bodyParser: true, // Parse JSON and URL-encoded bodies
});

// 2. Load routes
const routes = require("./routes");
routes(app);

// 3. Start server
app.start(process.env.PORT || 4000);
```

### 2. `routes.js`

This file acts as the central router. It uses Kaelum's helpers like `apiRoute` to define endpoints concisely.

```js
const usersController = require("./controllers/usersController");

module.exports = function (app) {
  // Apply middleware globally to a path
  app.setMiddleware("/users", require("./middlewares/authMock"));

  // Define RESTful routes for a resource
  // Recursive Nested Routing
  app.apiRoute("users", {
    get: usersController.list,
    post: usersController.create,
    
    // Nested parameter: /users/:id
    "/:id": {
      get: usersController.get,
      
      // Nested resource: /users/:id/posts
      "/posts": {
        get: usersController.posts
      }
    }
  });
};
```

### 3. `controllers/`

Controllers contain the actual business logic. They are standard Express middleware functions `(req, res, next)`.

```js
// controllers/usersController.js
exports.getUsers = (req, res) => {
  res.json([{ id: 1, name: "Alice" }]);
};

exports.createUser = (req, res) => {
  const newUser = req.body;
  // logic to save user...
  res.status(201).json(newUser);
};
```

## How to Adapt and Extend

### Adding a New Resource

To add a new resource, for example, `products`:

1.  **Create a Controller**: Create `controllers/productsController.js`.
2.  **Define Logic**: Export functions like `listProducts`, `createProduct`, etc.
3.  **Register Route**: Open `routes.js` and add:

    ```js
    const products = require("./controllers/productsController");

    app.apiRoute("products", {
      get: products.listProducts,
      post: products.createProduct,
    });
    ```

### Middleware

You can add middleware globally via `app.use()`, or per-route using `app.setMiddleware()`.

```js
// Protect all /products routes
app.setMiddleware("/products", (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).send("Unauthorized");
  next();
});
```

## Running the Project

```bash
npm install
npm start
```

The server will start (default port 4000 for API template). You can test endpoints using `curl` or Postman:

```bash
curl http://localhost:4000/users
```
