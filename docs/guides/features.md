# Features

Kaelum is a minimal framework built on top of **Express.js** to streamline both Web and API development.  
It abstracts repetitive tasks like **route registration, middleware management, security configuration, error handling, and server startup**, allowing developers to focus on business logic rather than boilerplate code.

The framework targets both **beginners**, by simplifying common patterns, and **advanced developers**, by exposing a flexible API that supports complex applications. Kaelum can be used for **single-page websites, multi-page web apps, and fully RESTful APIs**.


## Project Initialization

Kaelum provides a **CLI** for fast project creation.

### Interactive Mode

```bash
npx kaelum create
````

* Guided prompts allow selecting **project name** and **template** (`web` or `api`).
* Useful for beginners to quickly scaffold a ready-to-use project.

### Direct Command

::: code-group

```bash [Web Template]
npx kaelum create my-app --template web
```

```bash [API Template]
npx kaelum create my-api --template api
```

:::

The CLI automatically creates a **project structure** with `app.js`, `routes.js`, `middlewares/`, `views/` (for Web), and `public/` for static assets.
This ensures **consistent project organization** and **reduces setup time**.


## Environment Variables

Kaelum automatically loads variables from a `.env` file in your project root using `dotenv`.
No need to manually `require('dotenv').config()`. Just create a `.env` file and access variables via `process.env`.

## Core Functions

Kaelum exposes several functions for managing a server.
**Order of execution matters**: configuration and middleware must be set **before adding routes**; error handling should be added **after routes**.


### addRoute(path, handlers)

::: info
Registers a route and maps HTTP methods.

**How it works:**

* Accepts a **path string** and an **object** where keys are HTTP methods (`get`, `post`, etc.) and values are handler functions.
* Internally, Kaelum iterates over each method and registers it with Express.
* Can be used for Web pages or lightweight API endpoints.

::: code-group

```js [Web Template]
app.addRoute("/home", {
  get: (req, res) => res.sendFile(__dirname + "/views/index.html"), // serve HTML
  post: (req, res) => res.send("Form submitted!") // handle form submission
});
```

```js [API Template]
app.addRoute("/status", {
  get: (req, res) => res.json({ status: "ok" }) // simple JSON response
});
```

:::

**Possibilities:**

* Supports multiple methods in one call.
* Can attach **middleware per method** using arrays.
* Ideal for **mixed Web/API projects** or simple route grouping.

<details>
<summary>Advanced Usage</summary>

```js
app.addRoute("/data", {
  get: [authMiddleware, (req, res) => res.json({ data: [] })]
});
```

* Attach multiple middleware functions per method.
* Maintain concise route definitions while adding pre-processing logic.

</details>


### apiRoute(path, handlers)

::: info
Structured REST-style endpoint creation.

**How it works:**

* Designed for **nested REST resources**.
* Accepts a **base path** and an object mapping HTTP methods or subpaths.
* Nested objects represent sub-resources (e.g., `/users/:id`).
* Recursively registers all methods in Express.

```js
app.apiRoute("users", {
  get: (req, res) => res.json([{ id: 1, name: "Alice" }]), // list users
  post: (req, res) => res.status(201).json({ id: 2, name: "Bob" }), // create new user
  "/:id": {
    get: (req, res) => res.json({ id: req.params.id }), // get specific user
    put: (req, res) => res.json({ updated: true }), // update user
    delete: (req, res) => res.status(204).send() // delete user
  }
});
```

**Possibilities & Notes:**

* Automatically handles nested routes for resource subpaths.
* Keeps API definitions **organized and readable**.
* Can combine with middleware per route or method.
* Avoid calling after server startup to ensure proper registration.

<details>
<summary>Advanced Tips</summary>

* Nest multiple levels of sub-resources as needed.
* Attach middleware selectively per subpath.
* Ideal for REST APIs with complex relationships (e.g., `/users/:id/posts/:postId`).

</details>

:::

### setConfig(options)

::: info
Centralized configuration for your app.

```js
app.setConfig({
  cors: true,       // enable CORS
  helmet: true,     // security headers
  static: "public", // serve static files
  bodyParser: true, // JSON + urlencoded parsing
  logs: false,      // request logging
  port: 3000,       // default port
  views: { engine: 'ejs', path: './views' } // view engine config
});
```

**How it works:**

* Applies middleware and Express settings automatically.
* `static` sets Express’s `express.static()` directory.
* `logs` uses Morgan if installed.
* `bodyParser` enables parsing for JSON and URL-encoded data.
* `port` is used if `app.start()` is called without arguments.

<details>
<summary>Advanced Notes</summary>

* Should be called **before adding routes**.
* You can combine options to streamline **security, logging, and parsing setup**.
* Provides a centralized point to manage app behavior without touching Express directly.

</details>

:::

### setMiddleware(middleware)

::: info
Attach global middleware.

```js
const morgan = require("morgan");
app.setMiddleware(morgan("dev")); // logging middleware
```

**How it works:**

* Middleware is applied **globally** to all routes.
* Executed in the order of registration.
* Can be used for logging, authentication, or any Express-compatible middleware.

:::

### errorHandler()

::: info
Global error handling.

```js
app.errorHandler();
```

**How it works:**

* Captures unhandled exceptions in routes or middleware.
* Returns **JSON** for API endpoints or **HTML** for Web pages.
* Must be called **after all routes and middleware**.

:::

### healthCheck(path = "/health")

::: info
Quick endpoint to verify server status.

```js
app.healthCheck(); // default /health
app.healthCheck("/status");
```

**How it works:**

* Returns **HTTP 200** with a simple status.
* Useful for uptime monitoring, health probes, and DevOps integrations.

:::

### redirect(from, to)

::: info
Simplified URL redirection.

```js
app.redirect("/old-page", "/new-page");
```

* Sends a **302 redirect** automatically.
* Can be used for deprecated pages, moved content, or route restructuring.

:::

### start(port)

::: info
Starts the server.

```js
app.start();      // uses port from setConfig
app.start(4000);  // override port
```

**How it works:**

* Initializes Express server with all **routes, middleware, and configurations** applied.
* Logs the active port.
* Must be called **after all configuration and route setup**.

:::

## Putting It All Together

A complete **Web + API project**:

```js
const app = require("kaelum")();

// Configuration
app.setConfig({ cors: true, helmet: true, logs: true, port: 5000 });

// Global Middleware
const morgan = require("morgan");
app.setMiddleware(morgan("dev"));

// Web routes
app.addRoute("/", {
  get: (req, res) => res.sendFile(__dirname + "/views/index.html")
});

// API routes
app.apiRoute("users", {
  get: (req, res) => res.json([{ id: 1, name: "Alice" }]),
  post: (req, res) => res.status(201).json({ id: 2, name: "Bob" }),
  "/:id": {
    get: (req, res) => res.json({ id: req.params.id }),
    put: (req, res) => res.json({ updated: true }),
    delete: (req, res) => res.status(204).send()
  }
});

// Health check and error handling
app.healthCheck();
app.errorHandler();

// Start server
app.start();
```

**Notes:**

* Demonstrates **combined Web + API** setup.
* Shows **middleware, configuration, routes, healthCheck, errorHandler, and server start**.
* Emphasizes **proper order of execution**.


## Best Practices

::: tip

* Call `setConfig` and `setMiddleware` **before adding routes**.
* Use `addRoute` for Web, `apiRoute` for API endpoints.
* Call `start()` **last**.
  :::

::: info

* Nested API routes improve maintainability.
* Health check and error handler improve stability and observability.
  :::


Kaelum provides a **minimal yet powerful toolkit**, combining **simplicity, flexibility, and best practices** for Web and API development.
