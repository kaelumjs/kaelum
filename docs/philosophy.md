# Philosophy

Kaelum is intentionally minimal, pragmatic and community-oriented. This document explains the ideas and design principles that guided the framework, the intended audience and use cases, and how we hope Kaelum will fit into the wider open-source ecosystem.


## Overview

Kaelum aims to reduce the friction of starting web and API projects with Node.js by providing a small, well-documented abstraction on top of Express. Instead of hiding Express completely, Kaelum:

* **Encapsulates** common setup steps (body parsing, static serving, security middlewares),
* **Abstracts** repetitive boilerplate (routes, templates, CLI scaffolding), and
* **Automates** everyday defaults so beginners can focus on application logic.

The goal is not to replace Express for every use case, but to speed up learning and prototyping while preserving the flexibility needed for production work.


## Core design principles

### 1. Encapsulate, don’t obstruct

Kaelum intentionally wraps common Express behaviors into small, composable helpers (`start`, `addRoute`, `apiRoute`, `setConfig`, etc.). These helpers simplify the usual bootstrapping steps while leaving an escape hatch to access the raw Express `app` when the developer needs advanced control.

### 2. Sensible defaults, explicit opt-in controls

Defaults should make the common path easier (JSON parsing, static `public` folder, simple HTTP logging option), but advanced behavior must remain available. Kaelum provides `setConfig()` and `setMiddleware()` so users can enable, disable or replace behavior explicitly.

### 3. Minimal surface area

A small API surface reduces cognitive load for beginners. Each exported helper has a focused responsibility so the learning path is short and predictable.

### 4. Progressive disclosure

Start simple: generate a working app with `npx kaelum create my-app`. As users grow, they can explore the internals, replace defaults, and extend the app without rewiring everything.

### 5. Composition-friendly

Kaelum favors composition over convention. It is intentionally *unopinionated* about templating engines, ORMs or deployment strategies. This keeps the framework useful across many small projects and educational settings.


## Intended audience & use cases

Kaelum is designed for:

* **Students and beginners** who need a low-friction setup to learn web concepts (routes, middleware, HTTP methods) without spending hours on configuration.
* **Instructors and workshops** who want reproducible scaffolds to demonstrate patterns and examples.
* **Developers who prototype** — Kaelum provides a fast path to a working app so ideas can be validated quickly.
* **Experienced developers** who want a compact starter for small services or experiments; Kaelum does not prevent stepping down to raw Express when needed.

Typical use cases:

* Classroom exercises and tutorials.
* Rapid prototypes and internal tools.
* Small production services where a compact, well-understood stack is preferable.


## Educational goals

Kaelum was built with teaching in mind. Key educational intentions:

* Make it easy to explain WHAT is happening (routes, middleware, request/response life cycle) without distractions from setup.
* Provide clear examples and templates (Web and API) that reflect good practices (MVC structure, separation of concerns).
* Encourage experimentation: students can replace Kaelum defaults with raw Express code and observe the differences.


## Open source, community & ethics

Kaelum is released under the MIT license and embraces open-source values:

* **Transparency:** code and decision history are public on GitHub.
* **Collaboration:** contributions are welcome (issues, PRs, docs, examples).
* **Reuse:** Kaelum is intentionally permissive so other projects can build on top of it.

We believe tools that lower the barrier to entry benefit the wider community — teaching more people to build software and creating more fertile ground for future innovations.


## Frameworks on top of Kaelum

Kaelum is small by design and can serve as a foundation:

* Developers or teams can build *opinionated* layers on top of Kaelum (authentication stacks, batteries-included admin UI, multi-tenant scaffolds) without reinventing the bootstrapping logic.
* A small ecosystem of plugins or starter kits that rely on Kaelum could emerge, similar to how many projects build on Express.

If you want to design a framework on top of Kaelum, consider:

* Publishing as an npm package that depends on `kaelum`.
* Providing CLI templates that `npx kaelum create` can scaffold or extend.
* Following semantic versioning and clear migration notes so downstream projects remain stable.


## Rapid prototyping & productivity

Kaelum accelerates prototyping:

* A CLI scaffold produces a working project in seconds.
* `addRoute` and `apiRoute` reduce boilerplate for resource endpoints.
* Built-in toggles for CORS, Helmet and request logging let you enable sensible defaults with a single call.

**Minimal example:**

```js
// app.js (Kaelum)
const kaelum = require('kaelum');
const app = kaelum();

app.addRoute('/', {
  get: (req, res) => res.send('Hello from Kaelum!')
});

app.start(3000);
```

This compact form demonstrates the intention: fewer lines to a working app while keeping full control available.


## Trade-offs and limitations

Every abstraction brings trade-offs:

* Kaelum intentionally does **not** hide Express — so users still need to learn Express concepts eventually.
* Some advanced production patterns (complex middleware ordering, low-level server tuning) may require dropping to native Express APIs.
* Because Kaelum aims to be tiny, not every advanced convenience will be implemented; instead, Kaelum focuses on a reliable core and extensibility.


## Contribution, governance and code hygiene

To sustain Kaelum we encourage:

* Clear contribution guidelines (issue templates, PR checklist).
* Automated testing for core helpers.
* Consistent documentation (API reference and examples).
* Semantic versioning for predictable upgrades.

If you contribute, please follow the repository’s CONTRIBUTING guidelines and add tests for behavioral changes.


## Future directions

Planned or possible enhancements (non-exhaustive):

* **Auth helpers** (pluggable JWT middleware & examples).
* **Validation helpers** (lightweight request validation utilities).
* **Plugin system** so third-party extensions can register options and templates.
* **Better docs & examples** (live demos, playgrounds, VitePress site).
* **TypeScript typings** and optional TypeScript templates.
* **Community templates** for common stacks (database, auth providers, serverless).

All of these are subject to prioritization by contributors and the community.


## See also

* [Getting Started](/getting-started) — practical bootstrapping and first steps.
* [Guide: Features](/guides/features) — detailed behavior and examples for Kaelum helpers.
* [API Reference](/api/start) — function reference for `start`, `addRoute`, `setConfig`, etc.
* GitHub repository: `https://github.com/kaelumjs/kaelum`
