# Changelog

## [2.0.0-alpha.3](https://github.com/kaelumjs/kaelum/compare/create-kaelum-v2.0.0-alpha.3...create-kaelum-v2.0.0-alpha.3) (2026-11-25)


### Miscellaneous Chores

* **create-kaelum:** Synchronize kaelum versions

## [2.0.0-alpha.3](https://github.com/kaelumjs/kaelum/compare/create-kaelum-v2.0.0-alpha.2...create-kaelum-v2.0.0-alpha.3) (2026-11-25)


### ⚠ BREAKING CHANGES

* `defineRoutes` is removed; put routes in a function that receives the app and calls `app.route`. `app.route` takes only `(path, tree)`.
* single-file templates, testApp from the app file, remove defineRoutes

### Features

* **create-kaelum:** add AGENTS.md to the templates and smoke-test them in CI ([befb958](https://github.com/kaelumjs/kaelum/commit/befb958119c4cd1f3bee2dcae567dabd598ed383))
* **create-kaelum:** add AGENTS.md to the templates and smoke-test them in CI ([#103](https://github.com/kaelumjs/kaelum/issues/103)) ([f78276e](https://github.com/kaelumjs/kaelum/commit/f78276eb55415cac2d347f53e02dd770c40313da))
* **create-kaelum:** rewrite the CLI with @clack/prompts and detect the package manager ([33f39fd](https://github.com/kaelumjs/kaelum/commit/33f39fd817a94e627e6dec33d44a406a99931ea3))
* **create-kaelum:** rewrite the CLI with @clack/prompts and detect the package manager ([#98](https://github.com/kaelumjs/kaelum/issues/98)) ([0b0d60f](https://github.com/kaelumjs/kaelum/commit/0b0d60fa0ee00729ce77c64ab8cd85f71ce46ead))
* load .env when kaelum is imported and use a static home page in the web templates ([94b4f42](https://github.com/kaelumjs/kaelum/commit/94b4f422b46d855d288e2ccc95dcb691c34a7f51))
* load .env when kaelum is imported and use a static home page in the web templates ([#106](https://github.com/kaelumjs/kaelum/issues/106)) ([8db1c17](https://github.com/kaelumjs/kaelum/commit/8db1c17427687f980611842413bc409f2238d6f2))
* single-file templates, testApp from the app file, remove defineRoutes ([8eaf6d2](https://github.com/kaelumjs/kaelum/commit/8eaf6d2a074245c3603cd56a3319651d6217e41d))
* single-file templates, testApp from the app file, remove defineRoutes ([#105](https://github.com/kaelumjs/kaelum/issues/105)) ([67bf49c](https://github.com/kaelumjs/kaelum/commit/67bf49c582c24b1dcd0641c47743679847912b4f))

## [2.0.0-alpha.2](https://github.com/kaelumjs/kaelum/compare/create-kaelum-v2.0.0-alpha.1...create-kaelum-v2.0.0-alpha.2) (2026-11-18)


### Features

* move the create-kaelum templates to the 2.0 API ([8a88413](https://github.com/kaelumjs/kaelum/commit/8a884134ccd21cae19a6a16219ad3e50d2d4f756))
* move the create-kaelum templates to the 2.0 API ([#96](https://github.com/kaelumjs/kaelum/issues/96)) ([c0c21c5](https://github.com/kaelumjs/kaelum/commit/c0c21c52968c71082d51131d0af700b2b9d57dc0))

## [2.0.0-alpha.1](https://github.com/kaelumjs/kaelum/compare/create-kaelum-v2.0.0-alpha.0...create-kaelum-v2.0.0-alpha.1) (2026-11-15)


### Miscellaneous Chores

* **create-kaelum:** Synchronize kaelum versions

## [2.0.0-alpha.0](https://github.com/kaelumjs/kaelum/compare/create-kaelum-v1.10.4...create-kaelum-v2.0.0-alpha.0) (2026-11-15)


### ⚠ BREAKING CHANGES

* convert kaelum to TypeScript and ESM, switch to Vitest
* move project scaffolding to the create-kaelum package

### Features

* move project scaffolding to the create-kaelum package ([b32ee17](https://github.com/kaelumjs/kaelum/commit/b32ee17c95b4e7ecea239307bc2c8978d362dffa))


### Code Refactoring

* convert kaelum to TypeScript and ESM, switch to Vitest ([62f7456](https://github.com/kaelumjs/kaelum/commit/62f7456cceebae5b275a5d20994e5dc18fc7210d))
