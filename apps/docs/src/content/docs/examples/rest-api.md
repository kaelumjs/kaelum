---
title: REST API
description: Build a REST API with CRUD operations using Kaelum.
sidebar:
  order: 2
---

## Setup

```bash
npx kaelum create my-api --template api
cd my-api && npm install
```

## app.js

```js
const kaelum = require("kaelum");
const routes = require("./routes");
const app = kaelum();

app.setConfig({
  cors: true,
  helmet: true,
  logs: "dev",
  port: 3000,
});

routes(app);
app.healthCheck();
app.useErrorHandler();
app.start();
```

## routes.js

```js
const users = require("./controllers/usersController");

module.exports = (app) => {
  app.apiRoute("users", {
    get: users.list,
    post: users.create,
    "/:id": {
      get: users.show,
      put: users.update,
      delete: users.remove,
    },
  });
};
```

## controllers/usersController.js

```js
let users = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];
let nextId = 3;

module.exports = {
  list: (req, res) => res.json(users),

  create: (req, res) => {
    const user = { id: nextId++, ...req.body };
    users.push(user);
    res.status(201).json(user);
  },

  show: (req, res) => {
    const user = users.find(u => u.id === Number(req.params.id));
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  },

  update: (req, res) => {
    const i = users.findIndex(u => u.id === Number(req.params.id));
    if (i === -1) return res.status(404).json({ error: "Not found" });
    users[i] = { ...users[i], ...req.body };
    res.json(users[i]);
  },

  remove: (req, res) => {
    users = users.filter(u => u.id !== Number(req.params.id));
    res.status(204).send();
  }
};
```

## Testing

```bash
curl http://localhost:3000/users
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Charlie"}'
curl http://localhost:3000/users/1
curl -X PUT http://localhost:3000/users/1 -H "Content-Type: application/json" -d '{"name":"Updated"}'
curl -X DELETE http://localhost:3000/users/2
curl http://localhost:3000/health
```
