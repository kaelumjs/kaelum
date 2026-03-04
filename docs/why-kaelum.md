# Why Kaelum?

## Name & inspiration

**Kaelum** is inspired by the Latin word *caelum* (sky, heaven). The name evokes two closely related ideas:

* **Clarity and elevation** — reduce noise and let developers focus on the important parts of an application, elevating the learning and prototyping experience.
* **A small, steady platform** — a lightweight foundation you can build on, similar to how a clear sky is a simple but essential backdrop.

Kaelum was designed to be a compact layer above Express: small, pragmatic and easy to adopt, while remaining flexible for advanced uses.


## Problems Kaelum aims to solve

Developers — especially beginners and students — commonly face recurring friction when starting Node.js web projects:

* **Heavy initial setup**: configuring parsers, static serving, security middleware, route scaffolding and project structure takes time and distracts from application logic.
* **Boilerplate duplication**: many small projects repeat the same wiring (body parsers, static folders, logging).
* **Steep cognitive load for beginners**: newcomers must learn many independent tools (Express middleware, project layout, npm scripts) before writing a single route.
* **Inconsistent starter templates**: different tutorials recommend different layouts, which confuses learners.

Kaelum reduces this friction by providing an opinionated *minimal* starter surface while keeping escape hatches to raw Express for advanced control.


## Relationship with Express and other frameworks

### Kaelum & Express

Kaelum **builds on top of Express** rather than replacing it. Key aspects of this relationship:

* Kaelum **encapsulates** common Express setup (parsers, static serving, CORS, Helmet, logging) into a compact API (`createApp()`, `start()`, `addRoute()`, `setConfig()`).
* The underlying Express `app` is still available — you can call `app.use()`, `app.listen()` or any Express API when needed.
* This approach gives the best of both worlds: **simplicity for quick starts** and **full flexibility** for production-grade adjustments.

### Comparison with other projects

* **Express** — Very minimal; Kaelum uses Express as runtime and exposes simpler helpers and a CLI scaffold.
* **Fastify** — Focused on performance and schema-based validation; Kaelum’s goal is developer ergonomics and education rather than micro-benchmarks.
* **NestJS** — Highly opinionated, modular architecture with TypeScript-first design; Kaelum intentionally remains lightweight and unopinionated about controllers/DI to keep the barrier low.
* **Create React App / Vite scaffolding** — Kaelum’s CLI (`npx kaelum create`) is inspired by the idea of quick scaffolding — generate a working project with sensible defaults and an easy path to customization.


## Different “Whys” — reasons to choose Kaelum

### 1. For learning and teaching

* Short, predictable API helps instructors demonstrate web fundamentals without the distraction of tooling.
* Pre-configured templates and examples let students run code immediately and focus on HTTP concepts.

### 2. For rapid prototyping

* Start a working web or API project in seconds (`npx kaelum create my-app`), then iterate.
* Useful for demos, hacks, and proof-of-concept microservices where speed matters.

### 3. For small production services

* The lightweight surface is suitable for internal tools and microservices where a compact, readable codebase matters.
* When more control is required, the developer steps down to Express without rewriting the app.

### 4. For extensibility and ecosystem

* Kaelum is intentionally composable: you can create opinionated layers (authentication stacks, admin kits) *on top* of Kaelum.
* Its permissive license and small API make it easy to adopt as a dependency for higher-level tooling.


## Design decisions that support the “why”

* **Sensible defaults**: JSON parsing and a `public/` static folder are enabled by default so apps work immediately.
* **Single point of configuration**: `setConfig()` gives a single place to toggle CORS, Helmet, logs, static folder and more.
* **Small API surface**: a handful of helpers (`createApp`, `start`, `addRoute`, `apiRoute`, `setMiddleware`, `setConfig`) keeps learning friction low.
* **CLI-driven scaffolding**: `npx kaelum create` produces a ready-to-run structure using MVC conventions to teach best practices.
* **No strong opinions beyond defaults**: Kaelum avoids bundling ORM, template engine or deployment choices — leaving these to the developer.


## Example: Why the API is compact

**Express (typical minimal app)**

```js
// express-app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.static('public'));

app.get('/', (req, res) => res.send('Hello Express!'));
app.listen(3000, () => console.log('Listening on 3000'));
```

**Kaelum (equivalent in fewer lines)**

```js
// app.js (Kaelum)
const kaelum = require('kaelum');
const app = kaelum();

app.setConfig({ cors: true, helmet: true }); // safe defaults in one call
app.addRoute('/', { get: (req, res) => res.send('Hello Kaelum!') });
app.start(3000);
```

The Kaelum example demonstrates the central idea: reduce wiring and let developers declare intent.


## When **not** to choose Kaelum

Kaelum intentionally targets small to medium projects, education and prototyping. Consider other solutions if you need:

* Heavy architectural patterns out-of-the-box (e.g., NestJS with DI and modules).
* Maximum HTTP throughput and schema-driven JSON serialization as a primary concern (Fastify may be preferable).
* A full-stack opinionated platform with SSR and routing built-in (Next.js, Nuxt).


## Migration & interoperability

Because Kaelum relies on Express under the hood:

* You can migrate an Express app to Kaelum incrementally by replacing setup code with Kaelum helpers.
* Existing Express middleware still works with Kaelum apps.
* Kaelum projects can adopt third-party Express tools (templating engines, ORMs, validators) without friction.


## Concluding notes

Kaelum’s mission is pragmatic: provide a small, well-documented foundation that helps learners and engineers get productive fast — without hiding the underlying platform. It is best understood as a **starter scaffold + ergonomic helpers** for Express, optimized for education, prototypes and small services, and intentionally designed to be extended.


## See also

* [Getting Started](/getting-started) — how to scaffold and run your first Kaelum app.
* [Guide: Features](/guides/features) — detailed explanations and examples for Kaelum helpers.
* [Philosophy](/philosophy) — design principles and community goals.
* Express: [https://expressjs.com/](https://expressjs.com/)
* Create React App inspiration: [https://create-react-app.dev/](https://create-react-app.dev/)
* GitHub repo: `https://github.com/kaelumjs/kaelum`
