#!/usr/bin/env node
const { parseArgs } = require("node:util");
const { createProject } = require("./create");
const { version } = require("../package.json");

const TEMPLATES = {
  "js-web": { language: "js", template: "web" },
  "js-api": { language: "js", template: "api" },
  "ts-web": { language: "ts", template: "web" },
  "ts-api": { language: "ts", template: "api" },
};

// Kept for backward compatibility with `kaelum create --template web|api`.
const TEMPLATE_ALIASES = { web: "js-web", api: "js-api" };

function printHelp() {
  console.log(`
create-kaelum v${version}

Usage:
  npm create kaelum@latest                              Interactive mode
  npm create kaelum@latest <name>                       Ask for language and template
  npm create kaelum@latest <name> -- --template <t>     Skip the template questions

Options:
  -t, --template <template>   js-web, js-api, ts-web or ts-api (aliases: web, api)
      --install               Install dependencies without asking
      --no-install            Skip installing dependencies without asking
  -h, --help                  Show this help message
  -v, --version               Show the installed version

Templates:
  js-web     JavaScript + MVC with views & static files
  js-api     JavaScript + REST API
  ts-web     TypeScript + MVC with views & static files
  ts-api     TypeScript + REST API

Examples:
  npm create kaelum@latest my-app -- --template ts-web
  npm create kaelum@latest my-api -- --template js-api --no-install
`);
}

/**
 * Parse a template name such as "ts-api" into { language, template }.
 * Returns null when the name is unknown.
 */
function parseTemplate(value) {
  return TEMPLATES[TEMPLATE_ALIASES[value] || value] || null;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    allowNegative: true,
    options: {
      template: { type: "string", short: "t" },
      install: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (values.version) {
    console.log(`create-kaelum v${version}`);
    return;
  }

  if (values.help) {
    printHelp();
    return;
  }

  const defaults = { projectName: positionals[0], autoInstall: values.install };

  if (values.template) {
    const parsed = parseTemplate(values.template);
    if (!parsed) {
      console.error(`Unknown template: "${values.template}"`);
      console.error(
        `Available templates: ${Object.keys(TEMPLATES).join(", ")} (or aliases: web, api)`
      );
      process.exitCode = 1;
      return;
    }
    Object.assign(defaults, parsed);
  }

  const created = await createProject(defaults);
  if (!created) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Error running create-kaelum:", err.message || err);
  process.exit(1);
});
