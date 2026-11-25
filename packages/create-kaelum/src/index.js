#!/usr/bin/env node
const { parseArgs } = require("node:util");
const { createProject } = require("./create");
const {
  PACKAGE_MANAGERS,
  TEMPLATES,
  detectPackageManager,
  parseTemplate,
} = require("./options");
const { version } = require("../package.json");

const HELP = `
create-kaelum v${version}

Usage:
  npm create kaelum@next [name] [-- options]

Options:
  -t, --template <name>   ts-api, ts-web, js-api or js-web (api and web pick TypeScript)
      --pm <name>         npm, pnpm, yarn or bun. Default: the one running this command
      --install           Install dependencies without asking
      --no-install        Do not install dependencies
  -y, --yes               Use the defaults for anything not given: TypeScript, api, install
  -h, --help              Show this help
  -v, --version           Show the version

Without a terminal (CI, scripts) nothing is asked: the defaults above apply,
and the project name is required.

Examples:
  npm create kaelum@next my-api
  npm create kaelum@next my-site -- --template web
  pnpm create kaelum@next my-api --template js-api --no-install
`;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    allowNegative: true,
    options: {
      template: { type: "string", short: "t" },
      pm: { type: "string" },
      install: { type: "boolean" },
      yes: { type: "boolean", short: "y" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (values.version) return console.log(`create-kaelum v${version}`);
  if (values.help) return console.log(HELP);

  const given = {
    projectName: positionals[0],
    install: values.install,
    pm: values.pm ?? detectPackageManager(),
  };

  if (!PACKAGE_MANAGERS.includes(given.pm)) {
    return fail(`Unknown package manager: "${given.pm}". Use ${PACKAGE_MANAGERS.join(", ")}.`);
  }

  if (values.template) {
    const parsed = parseTemplate(values.template);
    if (!parsed) {
      return fail(`Unknown template: "${values.template}". Use ${Object.keys(TEMPLATES).join(", ")}, api or web.`);
    }
    Object.assign(given, parsed);
  }

  const interactive =
    !values.yes && Boolean(process.stdin.isTTY && process.stdout.isTTY) && !process.env.CI;

  const created = await createProject(given, { interactive });
  if (!created) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`create-kaelum: ${err.message || err}`);
  process.exit(1);
});
