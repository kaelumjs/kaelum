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

The CLI asks what you are building, the language and whether to install the dependencies:

- **api**: a REST API with validation and an auth middleware example;
- **web**: pages, a view and static files.

TypeScript is the default. `pnpm create`, `yarn create` and `bun create` work too: the project is installed and its next steps are printed with the same package manager.

Skip the questions with options. With npm, put them after `--`:

```bash
npm create kaelum@next my-api -- --template js-api --no-install
pnpm create kaelum@next my-site --template web
```

| Option | |
| --- | --- |
| `-t, --template` | `ts-api`, `ts-web`, `js-api`, `js-web`. `api` and `web` pick TypeScript |
| `--pm` | `npm`, `pnpm`, `yarn` or `bun`. Default: the one running the command |
| `--install`, `--no-install` | install the dependencies, or not, without asking |
| `-y, --yes` | defaults for anything not given: TypeScript, api, install |

Without a terminal, in CI or a script, nothing is asked: the defaults apply and the project name is required. Use `.` as the name to create the project in the current folder, if it is empty.

## Run it

```bash
cd my-app
npm run dev
```

`npm run dev` restarts on every change. TypeScript projects run the `.ts` files directly: Node 24 strips the types, so there is no build step while developing.

| Script | What it does |
| --- | --- |
| `npm run dev` | start with file watching |
| `npm start` | start the server (TypeScript: the compiled `dist/`) |
| `npm run build` | TypeScript only: compile to `dist/` |
| `npm run typecheck` | TypeScript only: check the types |

Environment variables come from `.env`, loaded automatically. The CLI creates one with `PORT=3000`. See [Configuration](/guide/configuration/#environment-variables).

## Project layout

```
my-app/
├── src/
│   ├── app.ts            creates the app, registers the routes, starts it
│   ├── routes/           one file per area
│   └── middlewares/
├── views/                web template: EJS views
├── public/               web template: static files
├── .env
└── package.json
```

The whole app fits in `src/app.ts`:

```ts title="src/app.ts"
import kaelum from "kaelum";
import users from "./routes/users.ts";

const app = kaelum({
  security: { cors: true },
});

users(app);

app.start();
```

Each file in `routes/` exports a function that receives the app. See [Routing](/guide/routing/#route-trees-in-their-own-files).

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
