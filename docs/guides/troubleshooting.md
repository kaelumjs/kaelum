# Troubleshooting

This page collects the most common runtime and configuration errors users encounter when installing or using Kaelum-based projects, explains why they occur and gives actionable fixes. The guidance is targeted at users creating apps with Kaelum templates (web/API). If you are contributing to the Kaelum source repository or testing locally, see the final section for a small note about `npm link`.

Still having issues? Try asking for help on the [GitHub Discussions](https://github.com/kaelumjs/kaelum/discussions) page

## Config

### This package is ESM-only (when using `require`)

```bash
Error \[ERR\_REQUIRE\_ESM]: require() of ES Module /path/to/dependency.js from /path/to/file.js not supported.
```

**Why it happens**  
A dependency (or your project) is an ES Module while you are loading it with `require()`. Kaelum templates use CommonJS by default.

**How to fix**
- If you are using Kaelum templates, prefer CommonJS:

```js
const kaelum = require('kaelum');
const app = kaelum();
```

* If you must use ESM in your project:

  * Add `"type": "module"` to `package.json`, or
  * Rename configuration or entry files to `.mjs` and use `import`.
* As a temporary workaround, use dynamic `import()` in CommonJS contexts.

---

### `Cannot find package 'kaelum'` / `Cannot find module 'kaelum'`

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'kaelum' imported from ...
```

**Why it happens**

* Kaelum is not installed in the project (`npm install` missing).
* You are attempting to `require('kaelum')` before the package is available (e.g., template created but `npm install` not run).
* The CLI was invoked without the package being published or linked.

**How to fix**

* In a generated project:

```bash [NPM]
$ cd my-project
$ npm install
```

* If you are testing Kaelum locally (Kaelum repo -> template project), use `npm link` (see "Local development" section).
* If published on npm, use the published package name with `npx`:

```bash
$ npx kaelum create my-app
```

* **Alternative**: You can also install Kaelum globally, which will allow you to use the `npx` command more easily. To do this, run the following command:

```bash
$ npm install -g kaelum
```

This will install Kaelum globally on your system, allowing you to use the `npx kaelum` command without needing to install Kaelum in each project individually. Note that this is just an alternative, and local installation is still the recommended option for most cases.

---

### `SyntaxError: Cannot use import statement outside a module`

```
SyntaxError: Cannot use import statement outside a module
```

**Why it happens**
The runtime is attempting to parse `import`/`export` in a file while Node is running in CommonJS mode.

**How to fix**

* Use CommonJS `require()` in the Kaelum templates (default), or
* Convert the project to ESM by adding `"type": "module"` to `package.json`, or rename files to `.mjs`.

---

## CLI

### `'kaelum' is not recognized` / Command not found

```
'kaelum' is not recognized as an internal or external command
```

**Why it happens**

* The CLI is not installed globally and you attempted to call `kaelum` directly, or Kaelum is not published (so `npx` cannot fetch it).

**How to fix**

* If Kaelum is published, use `npx`:

```bash
$ npx kaelum create my-app
```

* If testing locally (you cloned Kaelum and want to run the CLI from your machine), run:

```bash [NPM]
$ cd /path/to/kaelum
$ npm link
# then in another folder
$ npx kaelum create test-app
```

* On Windows, make sure your terminal was restarted after `npm link`.

---

### Template not found / ENOENT when creating a project

```
Error: ENOENT: no such file or directory, stat '.../cli/templates/web'
```

**Why it happens**

* CLI cannot find the selected template folder inside the Kaelum package.

**How to fix**

* Ensure your installation includes `cli/templates/web` and `cli/templates/api`.
* If you packaged Kaelum manually, make sure the `templates` folder is included in the published package (`files` in `package.json` or not ignored by `.npmignore`).

---

## Runtime / Server

### `TypeError: kaelum is not a function`

```
TypeError: kaelum is not a function
```

**Why it happens**

* `require('kaelum')` returned an object that is not the factory function (e.g. incorrect export shape).

**How to fix**

* Ensure Kaelum exports the factory function in `index.js`:

```js
const createApp = require('./createApp');
module.exports = createApp;
```

* Use it as:

```js
const kaelum = require('kaelum');
const app = kaelum(); // factory invocation
```

---

### `TypeError: app.start is not a function`

```
TypeError: app.start is not a function
```

**Why it happens**

* App was not created with the Kaelum factory (for example: using plain Express instead of `kaelum()`).

**How to fix**

```js
const kaelum = require('kaelum');
const app = kaelum();
app.start(3000);
```

---

### `EADDRINUSE: address already in use`

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

**Why it happens**

* Another process is already using the same port.

**How to fix**

* Choose another port:

```js
app.start(3001);
```

* Or free the port (platform dependent):

```bash
# macOS / Linux
$ lsof -i :3000
$ kill -9 <PID>

# Windows (PowerShell)
$ netstat -ano | findstr :3000
$ taskkill /PID <pid> /F
```

---

## Middleware & Routes

### `Middleware must be a function` or `Invalid app instance`

```
Error: Middleware must be a function
Error: Invalid app instance: cannot apply middleware
```

**Why it happens**

* `app.setMiddleware()` received a non-function value or `app` is not a Kaelum app.

**How to fix**

* Pass middleware functions (or an array of functions):

```js
app.setMiddleware(require('helmet')());
app.setMiddleware([mw1, mw2]);
```

* To mount middleware on a path:

```js
app.setMiddleware('/admin', authMiddleware);
```

---

### `Handler must be a function` or `Unsupported HTTP method`

```
Error: Handler for GET /users must be a function
Error: Unsupported HTTP method "FETCH" for route "/users"
```

**Why it happens**

* A route handler is not a function, or an unsupported method key is used.

**How to fix**

* Use function handlers and supported method keys (`get`, `post`, `put`, `delete`, `patch`, `all`):

```js
app.addRoute('/users', {
  get: (req, res) => res.json([]),
  post: (req, res) => res.status(201).send('created'),
  '/:id': {
    get: (req, res) => res.json({ id: req.params.id })
  }
});
```

---

### Missing optional middleware warnings (`cors`, `helmet`, `morgan`)

```
Kaelum: cors package not installed. Skipping CORS setup.
```

**Why it happens**

* These middleware packages are optional dependencies and may not be installed in the generated project.

**How to fix**

* Install what you need:

```bash [NPM]
$ npm install cors helmet morgan
```

* Or skip them if you don't require these features.

---

## Local development / testing Kaelum locally

> Note: the guidance above is aimed at end users using a published Kaelum package. If you are developing Kaelum itself locally, you may want to use `npm link` to test the CLI and the package without publishing.

### How to link Kaelum locally (developer workflow)

```bash [NPM]
# in the Kaelum repository root
$ npm link

# in a test project
$ npm link kaelum
$ npx kaelum create my-test-app
```

**Important**

* Use `npm link` only while actively developing locally. When Kaelum is published on npm, normal users should use `npx kaelum create` (no linking required).
