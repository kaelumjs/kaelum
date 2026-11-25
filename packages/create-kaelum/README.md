# create-kaelum

Scaffold a new [Kaelum](https://kaelumjs.matthcodes.dev) project.

```bash
npm create kaelum@next
```

The CLI asks what you are building (API or web app), the language and whether to install the dependencies. `pnpm create`, `yarn create` and `bun create` work too, and install with the same package manager.

Pass options to skip the questions. With npm, put them after `--`:

```bash
npm create kaelum@next my-api -- --template js-api --no-install
pnpm create kaelum@next my-site --template web
```

## Templates

| Template | Description |
| :------- | :---------- |
| `ts-api` | TypeScript REST API with validation and an auth example (default) |
| `ts-web` | TypeScript web app with pages, a view and static files |
| `js-api` | JavaScript REST API |
| `js-web` | JavaScript web app |

`api` and `web` pick the TypeScript version. Every template ships with example tests.

## Options

| Option | Description |
| :----- | :---------- |
| `-t, --template <name>` | Template to use |
| `--pm <name>` | `npm`, `pnpm`, `yarn` or `bun`. Default: the one running the command |
| `--install`, `--no-install` | Install the dependencies, or not, without asking |
| `-y, --yes` | Use the defaults for anything not given: TypeScript, api, install |
| `-h, --help` | Show help |
| `-v, --version` | Show the version |

Without a terminal (CI, scripts) nothing is asked: the defaults apply and the project name is required. Use `.` as the name to scaffold into the current folder, if it is empty.

## License

MIT
