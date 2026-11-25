# Changelog

## [2.0.0-alpha.3](https://github.com/kaelumjs/kaelum/compare/kaelum-v2.0.0-alpha.2...kaelum-v2.0.0-alpha.3) (2026-11-25)


### Miscellaneous Chores

* **kaelum:** Synchronize kaelum versions

## [2.0.0-alpha.2](https://github.com/kaelumjs/kaelum/compare/kaelum-v2.0.0-alpha.1...kaelum-v2.0.0-alpha.2) (2026-11-18)


### ⚠ BREAKING CHANGES

* make kaelum() the default export and remove the 1.x API ([#95](https://github.com/kaelumjs/kaelum/issues/95))
* the default export now creates a 2.0 app (kaelum()), replacing the 1.x factory and its setConfig/ddRoute/piRoute API. createKaelum is renamed to kaelum. The kaelum/validate and kaelum/test subpaths are removed (use the endpoint schemas and kaelum/testing). .env files are no longer loaded on import, and ejs is no longer a dependency.

### Features

* add resource routes, plugins, graceful shutdown, logger and testing client ([7e44516](https://github.com/kaelumjs/kaelum/commit/7e44516b4554d686ab2dc4464bcfe83dbaa77bc1))
* add resource routes, plugins, graceful shutdown, logger and testing client ([#93](https://github.com/kaelumjs/kaelum/issues/93)) ([9685b35](https://github.com/kaelumjs/kaelum/commit/9685b35c4f21dec3bd80c76cbda3b1db58bf7662))
* make kaelum() the default export and remove the 1.x API ([bd90d85](https://github.com/kaelumjs/kaelum/commit/bd90d85b9694c32da9ca6fd7ceb7154f0979fb99))
* make kaelum() the default export and remove the 1.x API ([#95](https://github.com/kaelumjs/kaelum/issues/95)) ([295fc32](https://github.com/kaelumjs/kaelum/commit/295fc32a66db9f1f6fa40e10ce4caa3f162ed828))
* move the create-kaelum templates to the 2.0 API ([8a88413](https://github.com/kaelumjs/kaelum/commit/8a884134ccd21cae19a6a16219ad3e50d2d4f756))
* move the create-kaelum templates to the 2.0 API ([#96](https://github.com/kaelumjs/kaelum/issues/96)) ([c0c21c5](https://github.com/kaelumjs/kaelum/commit/c0c21c52968c71082d51131d0af700b2b9d57dc0))

## [2.0.0-alpha.1](https://github.com/kaelumjs/kaelum/compare/kaelum-v2.0.0-alpha.0...kaelum-v2.0.0-alpha.1) (2026-11-15)


### Features

* add app options with production-ready defaults ([f0cb3a3](https://github.com/kaelumjs/kaelum/commit/f0cb3a3cdbb9f5a02a6e4ae5c892d7880010c36c))
* add app options with production-ready defaults ([#91](https://github.com/kaelumjs/kaelum/issues/91)) ([f1a313d](https://github.com/kaelumjs/kaelum/commit/f1a313d39a390ad37a066e5767462a3385f1b9de))
* add rate limit, CSRF, IP restriction and timing options ([e6aa89b](https://github.com/kaelumjs/kaelum/commit/e6aa89ba6d338272c8d58a3ba0bc8b402d63fc13))
* add rate limit, CSRF, IP restriction and timing options ([#92](https://github.com/kaelumjs/kaelum/issues/92)) ([e43a5a1](https://github.com/kaelumjs/kaelum/commit/e43a5a1f3672aeb4a1a4c269c49b7dfb1852181d))
* add the k schema builder ([9cef147](https://github.com/kaelumjs/kaelum/commit/9cef1476e8200d824ed6e652ee110b1ec0683aac))
* add the k schema builder ([#90](https://github.com/kaelumjs/kaelum/issues/90)) ([04f952f](https://github.com/kaelumjs/kaelum/commit/04f952fe1e4532e46105c8dfaa9018c33873442c))
* add the Kaelum class, Context and typed route trees ([b35856d](https://github.com/kaelumjs/kaelum/commit/b35856d0641922b8c0b2690cb52edfb58ec5060a))
* add the Kaelum class, Context and typed route trees ([c1f474f](https://github.com/kaelumjs/kaelum/commit/c1f474f138244836d4f25e0aca7d1159e66f430c))
* validate and type endpoint input with Standard Schema ([ff234c7](https://github.com/kaelumjs/kaelum/commit/ff234c745e86ff74e09d4fd37f80b02fd0037198))
* validate and type endpoint input with Standard Schema ([#89](https://github.com/kaelumjs/kaelum/issues/89)) ([23f9606](https://github.com/kaelumjs/kaelum/commit/23f96066a25b23cf52ff912a8b0dc84f8786d511))

## [2.0.0-alpha.0](https://github.com/kaelumjs/kaelum/compare/kaelum-v1.10.4...kaelum-v2.0.0-alpha.0) (2026-11-15)


### ⚠ BREAKING CHANGES

* upgrade to Express 5 and drop dotenv and morgan
* convert kaelum to TypeScript and ESM, switch to Vitest
* move project scaffolding to the create-kaelum package

### Features

* **docs:** rebuild docs on stock Starlight with AI-ready output ([3558f27](https://github.com/kaelumjs/kaelum/commit/3558f27fb0dd0665b5db0167612991cbf80c5f97))
* **docs:** rebuild docs on stock Starlight with AI-ready output ([e44d7d8](https://github.com/kaelumjs/kaelum/commit/e44d7d862db8c70cd33830cb519fd86a942f1de9))
* move project scaffolding to the create-kaelum package ([b32ee17](https://github.com/kaelumjs/kaelum/commit/b32ee17c95b4e7ecea239307bc2c8978d362dffa))
* upgrade to Express 5 and drop dotenv and morgan ([d05832a](https://github.com/kaelumjs/kaelum/commit/d05832aef9e54f5b18d85d38154f8e12e9e8605f))


### Code Refactoring

* convert kaelum to TypeScript and ESM, switch to Vitest ([62f7456](https://github.com/kaelumjs/kaelum/commit/62f7456cceebae5b275a5d20994e5dc18fc7210d))

## [1.10.4](https://github.com/kaelumjs/kaelum/compare/v1.10.3...v1.10.4) (2026-11-11)

### Features

* update Node.js version requirement and enhance API response handling with new middleware ([e1c62d9](https://github.com/kaelumjs/kaelum/commit/e1c62d9))

## [1.10.3](https://github.com/kaelumjs/kaelum/compare/v1.10.2...v1.10.3) (2026-11-03)

### Features

* add core features for ip restriction, pretty json, set config, and trailing slash middleware ([e2e7830](https://github.com/kaelumjs/kaelum/commit/e2e7830))

### Other Changes

* add unit tests for ipRestriction, prettyJson, and trailingSlash core features ([87a2ed9](https://github.com/kaelumjs/kaelum/commit/87a2ed9))
* add typings for PrettyJsonMode, TrimTrailingSlashOptions, IpRestrictionOptions ([509e5e4](https://github.com/kaelumjs/kaelum/commit/509e5e4))

## [1.10.2](https://github.com/kaelumjs/kaelum/compare/v1.10.1...v1.10.2) (2026-09-21)

### Features

* add 404 Not Found and 405 Method Not Allowed core handlers and application methods ([c5a89ec](https://github.com/kaelumjs/kaelum/commit/c5a89ec))

### Other Changes

* add tests for app.notFound and app.useMethodNotAllowed functionality ([de985b0](https://github.com/kaelumjs/kaelum/commit/de985b0))

## [1.10.1](https://github.com/kaelumjs/kaelum/compare/v1.10.0...v1.10.1) (2026-09-15)

### Features

* add centralized configuration helper and etag support ([662ed5d](https://github.com/kaelumjs/kaelum/commit/662ed5d))

## [1.10.0](https://github.com/kaelumjs/kaelum/compare/v1.9.4...v1.10.0) (2026-09-06)

### Features

* add CSRF protection support with origin checking and double-submit cookie strategies ([790035e](https://github.com/kaelumjs/kaelum/commit/790035e))

## [1.9.4](https://github.com/kaelumjs/kaelum/compare/v1.9.3...v1.9.4) (2026-08-29)

### Features

* add testApp utility for testing Kaelum applications via supertest ([36a06ac](https://github.com/kaelumjs/kaelum/commit/36a06ac))
* add test-utils package for HTTP integration testing via supertest ([bbc6b9d](https://github.com/kaelumjs/kaelum/commit/bbc6b9d))

## [1.9.3](https://github.com/kaelumjs/kaelum/compare/v1.9.2...v1.9.3) (2026-08-24)

### Features

* add request body, query, and params validation middleware ([60809e5](https://github.com/kaelumjs/kaelum/commit/60809e5))

## [1.9.2](https://github.com/kaelumjs/kaelum/compare/v1.9.1...v1.9.2) (2026-08-19)

### Features

* add group routing functionality with middleware support for modular route organization ([4395856](https://github.com/kaelumjs/kaelum/commit/4395856))

## [1.9.1](https://github.com/kaelumjs/kaelum/compare/v1.9.0...v1.9.1) (2026-08-17)

### Features

* add semantic response helper methods to Express response object ([e1f42b9](https://github.com/kaelumjs/kaelum/commit/e1f42b9))

## [1.9.0](https://github.com/kaelumjs/kaelum/compare/v1.8.9...v1.9.0) (2026-08-14)

### Features

* add requestId and timing middleware for request observability ([55ffbc1](https://github.com/kaelumjs/kaelum/commit/55ffbc1))

## [1.8.9](https://github.com/kaelumjs/kaelum/compare/v1.8.8...v1.8.9) (2026-06-29)

### Refactoring

* normalize default views path with path.resolve The views directory was set as a bare relative string './views', which depends on process.cwd() implicitly and could resolve incorrectly. Now uses path.resolve(process.cwd(), 'views'), consistent with the static middleware pattern. ([949d9f4](https://github.com/kaelumjs/kaelum/commit/949d9f4))

### Other Changes

* update and pin all dependencies to exact versions ([e92b0ae](https://github.com/kaelumjs/kaelum/commit/e92b0ae))

## [1.8.8](https://github.com/kaelumjs/kaelum/compare/v1.8.7...v1.8.8) (2026-06-05)

### Features

* support env-specific .env files (.env.production, etc) ([cecc30e](https://github.com/kaelumjs/kaelum/commit/cecc30e))

### Bug Fixes

* remove app.listen alias, preserve Express native method ([3757096](https://github.com/kaelumjs/kaelum/commit/3757096))

## [1.8.7](https://github.com/kaelumjs/kaelum/compare/v1.8.6...v1.8.7) (2026-05-24)

### Features

* add app.listen() as alias for app.start() Most Express users expect app.listen() by convention. This adds a simple alias so both methods work identically. Updated index.d.ts with the listen type signature and healthCheck(path, options) overload. ([cf28fb1](https://github.com/kaelumjs/kaelum/commit/cf28fb1))
* support two-argument overload (path, options) Previously, calling healthCheck with a string path meant you couldn't also pass options like include or readinessCheck. Now supports:   app.healthCheck('/status', { include: { metrics: true } }) The string path is merged into options, with the path taking priority. The createApp wrapper now forwards both arguments to registerHealth. ([c1aa5d7](https://github.com/kaelumjs/kaelum/commit/c1aa5d7))

## [1.8.6](https://github.com/kaelumjs/kaelum/compare/v1.8.5...v1.8.6) (2026-05-22)

### Bug Fixes

* expose removeMiddleware() and getMiddleware() on app These methods were documented but never wired up in createApp.js. Users had no public API to remove tracked middleware or list registered entries. - app.removeMiddleware([path]) — delegates to setMiddleware.remove() - app.getMiddleware() — returns app.locals._kaelum_middlewares - Updated index.d.ts with corresponding type definitions - Added head/options to RouteHandlers interface ([0f85d44](https://github.com/kaelumjs/kaelum/commit/0f85d44))
* add HEAD and OPTIONS to supported HTTP methods The supportedMethods array only included get, post, put, delete, patch, and all. Users attempting to register head or options handlers via addRoute received an 'Unsupported key' error, even though Express supports these methods natively. Added 'head' and 'options' to the array. ([b687204](https://github.com/kaelumjs/kaelum/commit/b687204))

## [1.8.5](https://github.com/kaelumjs/kaelum/compare/v1.8.4...v1.8.5) (2026-04-28)

### Bug Fixes

* modernize TypeScript templates with proper imports - Convert all require() calls to ESM import syntax across 6 files - Remove broken ../../package.json reference in API routes template - Templates now align with TypeScript best practices (esModuleInterop) Affected: ts/api (app.ts, routes.ts), ts/web (app.ts, routes.ts, pagesController.ts) ([c3b0506](https://github.com/kaelumjs/kaelum/commit/c3b0506))

## [1.8.4](https://github.com/kaelumjs/kaelum/compare/v1.8.3...v1.8.4) (2026-04-20)

### Bug Fixes

* add missing apiRoute type overloads for handler and crud shorthand ([c56a371](https://github.com/kaelumjs/kaelum/commit/c56a371))
* respect user-provided morgan format in setConfig logs option ([f7ef35e](https://github.com/kaelumjs/kaelum/commit/f7ef35e))

## [1.8.3](https://github.com/kaelumjs/kaelum/compare/v1.8.2...v1.8.3) (2026-04-08)

### Bug Fixes

* remove hardcoded version from template HTML footers ([6d06f62](https://github.com/kaelumjs/kaelum/commit/6d06f62))

### Documentation

* add explanatory comment for process.cwd() usage in TS pagesController ([fdeb448](https://github.com/kaelumjs/kaelum/commit/fdeb448))
* update README with TypeScript templates, new CLI commands, and missing features ([48894ba](https://github.com/kaelumjs/kaelum/commit/48894ba))

## [1.8.2](https://github.com/kaelumjs/kaelum/compare/v1.8.1...v1.8.2) (2026-04-07)

### Bug Fixes

* read version dynamically from package.json in template meta endpoints ([30a51ff](https://github.com/kaelumjs/kaelum/commit/30a51ff))
* replace Portuguese sample names with English in template controllers ([3d0491f](https://github.com/kaelumjs/kaelum/commit/3d0491f))

## [1.8.1](https://github.com/kaelumjs/kaelum/compare/v1.8.0...v1.8.1) (2026-04-05)

### Bug Fixes

* remove redundant try/catch re-throws in start module ([f005d0c](https://github.com/kaelumjs/kaelum/commit/f005d0c))
* log warning on setConfig fallback and add JSDoc to wrapper methods ([bd4a459](https://github.com/kaelumjs/kaelum/commit/bd4a459))
* remove stale comment and harden express require in setConfig ([20db7dd](https://github.com/kaelumjs/kaelum/commit/20db7dd))
* remove redundant try/catch re-throws in start module ([c8317d2](https://github.com/kaelumjs/kaelum/commit/c8317d2))

### Refactoring

* flatten double-nested try in errorHandler onError hook ([ff0e99c](https://github.com/kaelumjs/kaelum/commit/ff0e99c))

## [1.8.0](https://github.com/kaelumjs/kaelum/compare/v1.7.0...v1.8.0) (2026-03-29)

### Features

* add TypeScript templates and improve CLI experience ([c088a76](https://github.com/kaelumjs/kaelum/commit/c088a76))

### Other Changes

* generate package-lock.json for project dependencies ([4567789](https://github.com/kaelumjs/kaelum/commit/4567789))

## [1.7.0](https://github.com/kaelumjs/kaelum/compare/v1.6.0...v1.7.0) (2026-03-21)

### Features

* add zero-dependency rate limiting toggle - Introduce core/rateLimit.js with MemoryStore and createRateLimiter factory - Add rateLimit option to setConfig (true  ( object )

## [1.6.0](https://github.com/kaelumjs/kaelum/compare/v1.4.0...v1.6.0) (2026-03-14)

### Features

* add graceful shutdown with app.close() and app.onShutdown() ([2abee37](https://github.com/kaelumjs/kaelum/commit/2abee37))
* Introduce a plugin system with pp.plugin and pp.getPlugins methods for extending Kaelum applications. ([fc938cf](https://github.com/kaelumjs/kaelum/commit/fc938cf))

### Other Changes

* Revert version to 1.5.0 in package.json and package-lock.json ([f29b3c8](https://github.com/kaelumjs/kaelum/commit/f29b3c8))
* Delete CHANGELOG.md ([f94d422](https://github.com/kaelumjs/kaelum/commit/f94d422))
* ci: replace release-please with tag-based changelog release ([5cd3ab7](https://github.com/kaelumjs/kaelum/commit/5cd3ab7))
* Revert version to 1.5.0 in manifests and changelog ([3022c3f](https://github.com/kaelumjs/kaelum/commit/3022c3f))
* release 1.7.0 ([6b7af84](https://github.com/kaelumjs/kaelum/commit/6b7af84))
* ci: merge publish into release workflow ([d71bc29](https://github.com/kaelumjs/kaelum/commit/d71bc29))
* release 1.6.0 ([0aae76b](https://github.com/kaelumjs/kaelum/commit/0aae76b))
* ci: use PAT for release-please to create pull requests ([b8af262](https://github.com/kaelumjs/kaelum/commit/b8af262))
* ci: use trusted publisher (OIDC) for npm publish ([7b67eaf](https://github.com/kaelumjs/kaelum/commit/7b67eaf))

## [1.4.0](https://github.com/kaelumjs/kaelum/compare/v1.3.3...v1.4.0) (2026-01-12)

### What's Changed
* update examples and core api documentation by @MatheusCampagnolo in https://github.com/MatheusCampagnolo/kaelum/pull/24
* release v1.3.5 with security and dx improvements by @MatheusCampagnolo in https://github.com/MatheusCampagnolo/kaelum/pull/25
* enable EJS view engine by default by @MatheusCampagnolo in https://github.com/MatheusCampagnolo/kaelum/pull/26
* update documentation for v1.4.0 features (dotenv, views config) by @MatheusCampagnolo in https://github.com/MatheusCampagnolo/kaelum/pull/28
* release v1.4.0 with auto-dotenv, view config and native watch mode by @MatheusCampagnolo in https://github.com/MatheusCampagnolo/kaelum/pull/29

## 1.3.3 (2025-09-10)

### Highlights

* ✅ **Official documentation site** published (VitePress) and deployed to GitHub Pages:
  https://matheuscampagnolo.github.io/kaelum/

* ✅ **CI workflow** added to build docs and publish the static output to `gh-pages` automatically when `main` is updated.

* ✅ **Packaging improvements**
  - `.npmignore` updated (excluded `.github`, `docs`, and other non-shipping files).
  - `package.json` metadata improved for npm readiness.
  - Project version bumped to **v1.3.3**.

---

### CLI
* `npx kaelum create` — interactive project generator with templates:
  - `web` template (static + views + middleware scaffold)
  - `api` template (REST scaffold with controllers and middleware)

### Core helpers (CommonJS usage)
```js
const kaelum = require('kaelum');
const app = kaelum();
````

**Key functions:**

* `app.setConfig(options)` — configure built-in features:

  * `{ cors, helmet, static, bodyParser, logs, port }`
* `app.start(port, callback)` — starts the HTTP server (port fallback to config or default)
* `app.addRoute(path, handlers)` — register routes; accepts:

  * a single handler (assumed GET), or
  * an object with HTTP methods `{ get, post, put, delete, ... }`
* `app.apiRoute(resource, handlers)` — build RESTy resource trees with nested subpaths (e.g. `/:id`)
* `app.setMiddleware(...)` — register middleware(s), arrays or mount under a path
* `app.redirect(from, to, status)` — helper to register redirects
* `app.healthCheck(path = '/health')` — standard health endpoint
* `app.useErrorHandler(options)` — attaches Kaelum's JSON error handler

---

### Notable fixes & changes in v1.3.3

* `ci(docs)`: Added GitHub Actions workflow to build docs and publish the static site to the `gh-pages` branch.
* `chore`: Added `.npmignore` entries to exclude `.github`, `docs` and other non-shipping files from npm package.
* `fix(docs)`: Added dependency override and regenerated `docs/package-lock.json` to avoid a broken `debug@4.4.2` resolved URL in CI.
* `docs`: Updated README with badges and link to the hosted documentation.

---

### Post-release notes & next steps

* Expand `setConfig` in a future release (e.g., add logging configuration, extended static options).
* Add a CI job to publish GitHub Release artifacts automatically (optional).
* Consider publishing prebuilt templates / starters as separate packages or templates repo.

---

Thanks to everyone who contributed and tested the docs build. Feedback and PRs are welcome — see the docs for contribution pointers.
