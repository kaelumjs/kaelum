# Getting Started

## Overview


**Kaelum.JS** is a minimalist Node.js framework that wraps and simplifies common Express.js patterns. It aims to reduce boilerplate and accelerate learning for students and developers by providing:

- a tiny public API (`kaelum()`, `app.addRoute()`, `app.start()`),
- a CLI to scaffold projects (`npx kaelum create`),
- sensible defaults (body parsing, static serving, optional security middleware),
- templates for Web apps and REST APIs.

Kaelum acts as a thin ergonomic layer over Express so you keep full flexibility while removing repetitive setup.

The name **Kaelum** is a modern take on the Latin word **"Caelum,"** meaning "sky" or "heavens." Inspired by the idea of a vast and open horizon, Kaelum was conceived as a flexible and uncluttered foundation for your projects.

For a deeper understanding of the project's motivations, see the [Philosophy](./philosophy) and/or [Why Kaelum?](./why-kaelum) section.

## Scaffolding your First Kaelum Project

:::tip SUPPORTED ENVIRONMENT
Kaelum targets modern Node.js versions. For development and production, we recommend:

- [Node.js](https://nodejs.org/en/) **16.x** or **18.x** (LTS versions).  
- npm 8+ or an equivalent package manager (yarn, pnpm).

> Note: If you need to support older Node.js versions, test locally and pin dependencies accordingly.
:::

```bash [NPM]
$ npx kaelum create
```
- follow prompts: project name -> choose template (web | api)

This command copies a minimal template into `./<project-name>` with a ready-to-run project structure (MVC-ish) and example files.


:::: details Using kaelum create with command line options

You can also specify the project name and template using additional command line options. For example, to scaffold a Kaelum web app, run:

```bash [npm]
$ npx kaelum create my-app --template web
```

::::

After scaffolding:

```bash [NPM]
$ cd my-project
$ npm install
$ npm start
```

The generated project includes:

* `app.js` — example usage of Kaelum helpers,
* `routes.js` — where example routes call `app.addRoute(...)`,
* `public/` and `views/` for static and template files (web template),
* `controllers/` and `middlewares/` directories for user code.


## Manual Installation

If you prefer to add Kaelum to an existing Node project:

```bash
npm install --save kaelum
```

Then create `app.js`:

```js
const kaelum = require('kaelum');
const app = kaelum();

app.addRoute('/', {
  get: (req, res) => res.send('Hello from Kaelum!')
});

app.start(3000);
```

Run:

```bash
node app.js
```


## Index.html and Project Root (What the scaffolder creates)

The scaffolder generates a small project layout (web template):

```
my-web-app/
├── public/          # static assets (css, images)
│   └── style.css
├── views/           # html templates
│   └── index.html
├── controllers/
│   └── pagesController.js
├── middlewares/
│   └── .gitkeep
├── routes.js
├── app.js
└── package.json
```

The `app.js` generated demonstrates `app.addRoute()`, a sample middleware and `app.start()`. It is intentionally minimal so beginners can inspect each file quickly.


## Command Line Interface (CLI)

When you run `npx kaelum create`, the CLI asks:

1. **Project name** — name of the new folder to create.
2. **Template** — `web` (default) or `api` (API template scaffolds controller & route examples).

After the copy completes you get an instruction message with the commands:

```text
✅ Project "my-web-app" created!
➡️ cd my-web-app
➡️ npm install && npm start
```

> Tip: During development you can `npm link` inside the local Kaelum repo and test `npx kaelum create` without publishing to npm.


## Example: Minimal Kaelum `app.js`

```js
// app.js (minimal)
const kaelum = require('kaelum');
const app = kaelum();

app.addRoute('/', {
  get: (req, res) => res.send('Hello from Kaelum!')
});

app.start(3000);
```

Short explanation:

* `kaelum()` returns an Express-backed app with Kaelum helpers attached.
* `app.addRoute(path, handlers)` accepts either a function (GET) or an object `{ get, post, put, ... }`.
* `app.start(port)` starts the server; if you prefer, `app.setConfig({ port: 3000 })` can persist the port.


## Community Templates & Advanced Scaffolding

Kaelum templates are simple folders under the CLI's `templates/` directory. In the future we plan to support community templates and configuration choices (e.g., TypeScript, Dockerfile scaffolding).


## Where to go next

* Read [Features](./guides/features) for in-depth examples of `setConfig()`, `apiRoute()`, `static()`, `redirect()` and error handling.
* Read [Philosophy](./philosophy) to learn why we built Kaelum and the meaning behind the name.
* Explore [API](./api/start) to view function signatures and examples for each core helper.
