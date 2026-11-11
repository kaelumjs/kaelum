---
title: Overview
description: What is Kaelum and why you should use it.
sidebar:
  order: 1
---

**Kaelum** is a minimalist Node.js framework built on top of Express.js. It reduces boilerplate and accelerates development by providing sensible defaults and a tiny, opinionated API.

## What It Does

- **Wraps Express** with a thin ergonomic layer — no hidden magic
- **Pre-configures** body parsing, static files, and view engines
- **Simplifies** routing with `addRoute()` and `apiRoute()` tree syntax
- **Toggles** CORS, Helmet, Morgan with single config flags
- **Scaffolds** projects with `npx kaelum create`

## Quick Example

```js
const app = require("kaelum")();

app.setConfig({
  cors: true,
  helmet: true,
  logs: "dev",
  static: "public",
});

app.apiRoute("users", {
  get: (req, res) => res.json([]),
  post: (req, res) => res.status(201).json(req.body),
  "/:id": {
    get: (req, res) => res.json({ id: req.params.id }),
    put: (req, res) => res.json({ updated: true }),
    delete: (req, res) => res.status(204).send(),
  },
});

app.healthCheck();
app.useErrorHandler();
app.start(3000);
```

That's a **complete REST API** with security headers, CORS, logging, health checks, and error handling — in 20 lines.

## Who It's For

- **Students** learning Node.js who want a gentle introduction
- **Developers** tired of copy-pasting Express boilerplate
- **Teams** that want consistent project structure
- **Prototypers** who need a working API in minutes

## Installation

```bash
# Scaffold a new project
npx kaelum create my-app --template web

# Or add to existing project
npm install kaelum
```

:::note
Kaelum requires Node.js 24.22.1+ and npm 8+.
:::
