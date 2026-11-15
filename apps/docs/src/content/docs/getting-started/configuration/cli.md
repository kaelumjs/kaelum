---
title: CLI Reference
description: Kaelum command line interface for scaffolding projects.
sidebar:
  order: 2
---

## Installation

Kaelum CLI comes bundled with the `kaelum` package. No separate install needed:

```bash
npx kaelum create
```

## Commands

### `kaelum create`

Scaffold a new Kaelum project with interactive prompts or flags.

```bash
npx kaelum create [project-name] [--template <template>]
```

#### Interactive Mode

```bash
npx kaelum create
```

Prompts for:
1. **Project name**
2. **Language** — JavaScript or TypeScript
3. **Template** — web (MVC) or api (REST)
4. **Install dependencies** — auto-run `npm install`

#### Direct Mode

```bash
# JavaScript web app
npx kaelum create my-app --template js-web

# JavaScript REST API
npx kaelum create my-api --template js-api

# TypeScript web app
npx kaelum create my-app --template ts-web

# TypeScript REST API
npx kaelum create my-api --template ts-api
```

:::note
Legacy aliases `web` and `api` still work and map to `js-web` and `js-api` respectively.
:::

### `kaelum --version`

Print the installed Kaelum version:

```bash
npx kaelum --version
# kaelum v1.x.x
```

### `kaelum info`

Print environment information (useful for bug reports):

```bash
npx kaelum info
# Kaelum CLI
#   Kaelum:   v1.x.x
#   Node.js:  v20.11.0
#   OS:       Windows_NT 10.0.22631 (x64)
#   Platform: win32
```

### `kaelum help`

Show all available commands and options.

## Templates

All templates are available in JavaScript and TypeScript variants.

### JavaScript Web (`js-web`)

MVC structure for page-driven sites:

```
my-web-app/
├── public/
│   └── style.css
├── views/
│   └── index.html
├── controllers/
│   └── pagesController.js
├── middlewares/
│   └── logger.js
├── routes.js
├── app.js
├── .env
├── .gitignore
└── package.json
```

### JavaScript API (`js-api`)

Optimized for REST API projects:

```
my-api/
├── controllers/
│   └── usersController.js
├── middlewares/
│   └── authMock.js
├── routes.js
├── app.js
├── .env
├── .gitignore
└── package.json
```

### TypeScript Web (`ts-web`)

TypeScript MVC structure with `tsx` for development:

```
my-web-app/
├── src/
│   ├── app.ts
│   ├── routes.ts
│   ├── controllers/
│   │   └── pagesController.ts
│   └── middlewares/
│       └── logger.ts
├── public/
│   └── style.css
├── views/
│   └── index.html
├── tsconfig.json
├── .env
├── .gitignore
└── package.json
```

### TypeScript API (`ts-api`)

TypeScript REST API with full type safety:

```
my-api/
├── src/
│   ├── app.ts
│   ├── routes.ts
│   ├── controllers/
│   │   └── usersController.ts
│   └── middlewares/
│       └── authMock.ts
├── tsconfig.json
├── .env
├── .gitignore
└── package.json
```

## After Scaffolding

### JavaScript projects

```bash
cd my-app
npm start       # Start the server
npm run dev     # Start with file watching
```

### TypeScript projects

```bash
cd my-app
npm run dev     # Start dev server with tsx (hot-reload)
npm run build   # Compile TypeScript to JavaScript
npm start       # Run compiled output from dist/
```

## Auto-generated Files

Every scaffolded project includes:

- **`.env`** — Environment variables with sensible defaults (`PORT=3000`, `NODE_ENV=development`)
- **`.gitignore`** — Standard Node.js exclusions (`node_modules/`, `.env`, `dist/`, `*.log`)

:::note
Requires Node.js 24.22.1+ and npm 8+.
:::
