---
title: Quick Start
description: Build your first Kaelum app in 5 minutes.
sidebar:
  order: 3
---

Get a working API running in under 5 minutes.

## 1. Create the Project

```bash
npx kaelum create my-api --template js-api
cd my-api
```

The CLI scaffolds a ready-to-run project:

```
my-api/
├── controllers/
│   └── usersController.js   ← business logic
├── middlewares/
│   └── authMock.js           ← example middleware
├── routes.js                 ← route definitions
├── app.js                    ← entry point
├── .env                      ← environment variables
└── package.json
```

## 2. Understand the Entry Point

Open `app.js` — this is the entire server:

```js
const kaelum = require("kaelum");
const routes = require("./routes");
const app = kaelum();

app.setConfig({
  cors: true,        // cross-origin requests
  helmet: true,      // security headers
  logs: "dev",       // request logging
  port: 3000,
});

routes(app);
app.healthCheck();
app.useErrorHandler();
app.start();
```

**What's happening:**
1. `kaelum()` creates a pre-configured Express app
2. `setConfig()` activates CORS, Helmet, Morgan, and sets the port
3. `routes(app)` registers your API endpoints
4. `healthCheck()` adds `GET /health` for monitoring
5. `useErrorHandler()` catches unhandled errors globally
6. `start()` launches the HTTP server with graceful shutdown

## 3. Start the Server

```bash
npm start
```

You should see:

```
🛡️  CORS activated.
🛡️  Helmet activated.
📊 Request logging enabled (morgan: dev).
🚀 Kaelum server running at http://localhost:3000
```

## 4. Test Your API

```bash
# List users
curl http://localhost:3000/users

# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Charlie", "email": "charlie@example.com"}'

# Get a user
curl http://localhost:3000/users/1

# Health check
curl http://localhost:3000/health
```

## 5. Add Your Own Route

Open `routes.js` and add a new resource:

```js
module.exports = (app) => {
  // existing users routes...

  // Add a new resource
  app.apiRoute("products", {
    get: (req, res) => res.json([{ id: 1, name: "Widget" }]),
    post: (req, res) => res.status(201).json(req.body),
  });
};
```

Restart the server and test:

```bash
curl http://localhost:3000/products
```

## Next Steps

- 📖 [CLI Reference](/getting-started/configuration/cli/) — all templates and options
- ⚙️ [setConfig()](/api-reference/set-config/) — configuration options
- 🛣️ [addRoute()](/api-reference/add-route/) — routing patterns
- 🔌 [Plugin System](/guide/features/plugin-system/) — extend with plugins
