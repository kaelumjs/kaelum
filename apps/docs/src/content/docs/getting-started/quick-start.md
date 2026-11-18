---
title: Quick start
description: Create a Kaelum project, run it and test it.
sidebar:
  order: 2
---

## Create a project

```bash
npm create kaelum@next my-app
```

The CLI asks for a language (JavaScript or TypeScript) and a template:

- **api**: a REST API with validation and an auth middleware example;
- **web**: pages, a view and static files.

Skip the questions with `--template`:

```bash
npm create kaelum@next my-api -- --template ts-api
```

Templates: `js-api`, `js-web`, `ts-api`, `ts-web`.

## Run it

```bash
cd my-app
npm run dev
```

`npm run dev` restarts on every change. TypeScript projects run the `.ts` files directly: Node 24 strips the types, so there is no build step while developing.

| Script | What it does |
| --- | --- |
| `npm run dev` | start with file watching |
| `npm test` | run the tests with `node --test` |
| `npm start` | start the server (TypeScript: the compiled `dist/`) |
| `npm run build` | TypeScript only: compile to `dist/` |

Environment variables come from `.env`, loaded by Node's `--env-file-if-exists`. The CLI creates one with `PORT=3000`.

## Project layout

```
my-app/
├── src/
│   ├── app.ts            creates the app and exports createApp()
│   ├── server.ts         starts it
│   ├── app.test.ts       example tests
│   ├── routes/           route trees, one file per area
│   └── middlewares/
├── .env
└── package.json
```

`app.ts` builds the app without starting it, so the tests can use the same app:

```ts title="src/app.ts"
import kaelum from "kaelum";
import { userRoutes } from "./routes/users.ts";

export function createApp() {
  const app = kaelum({ security: { cors: true } });
  app.route(userRoutes);
  return app;
}
```

```ts title="src/server.ts"
import { createApp } from "./app.ts";

const app = createApp();
await app.start(Number(process.env.PORT ?? 3000));
```

## Add Kaelum to an existing project

```bash
npm install kaelum@next
```

```ts
import kaelum from "kaelum";

const app = kaelum();
app.get("/hello", () => ({ hello: "world" }));
await app.start(3000);
```

To add Kaelum next to an Express app you already have, see [Using with Express](/guide/express/).

## Next steps

- [Routing](/guide/routing/): route trees, resources and shortcuts.
- [Context](/guide/context/): what a handler receives and how it responds.
- [Validation](/guide/validation/): typed and validated input.
