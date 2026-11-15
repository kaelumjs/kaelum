#!/usr/bin/env node
const { createProject } = require("./create");
const path = require("path");
const argv = process.argv.slice(2);

function getVersion() {
  const pkg = require(path.join(__dirname, "..", "package.json"));
  return pkg.version;
}

function printVersion() {
  console.log(`kaelum v${getVersion()}`);
}

function printInfo() {
  const os = require("os");
  console.log(`Kaelum CLI`);
  console.log(`  Kaelum:   v${getVersion()}`);
  console.log(`  Node.js:  ${process.version}`);
  console.log(`  OS:       ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`  Platform: ${os.platform()}`);
}

function printHelp() {
  console.log(`
Kaelum CLI v${getVersion()}

Usage:
  kaelum create                                  Interactive mode
  kaelum create <name>                           Interactive template choice
  kaelum create <name> --template <template>     Non-interactive

Templates:
  js-web     JavaScript + MVC with views & static files
  js-api     JavaScript + REST API
  ts-web     TypeScript + MVC with views & static files
  ts-api     TypeScript + REST API
  web        Alias for js-web
  api        Alias for js-api

Commands:
  kaelum help              Show this help message
  kaelum --version, -v     Show installed version
  kaelum info              Show environment information

Examples:
  kaelum create my-app --template ts-web
  kaelum create my-api --template js-api
`);
}

/**
 * Resolve legacy template aliases for backward compatibility.
 * "web" -> "js-web", "api" -> "js-api"
 */
function resolveTemplateAlias(template) {
  const aliases = { web: "js-web", api: "js-api" };
  return aliases[template] || template;
}

/**
 * Parse a combined template value like "js-web" into { language, template }.
 * Returns null if invalid.
 */
function parseTemplate(value) {
  const resolved = resolveTemplateAlias(value);
  const valid = {
    "js-web": { language: "js", template: "web" },
    "js-api": { language: "js", template: "api" },
    "ts-web": { language: "ts", template: "web" },
    "ts-api": { language: "ts", template: "api" },
  };
  return valid[resolved] || null;
}

async function main() {
  const [command, maybeName, maybeFlag, maybeTemplate] = argv;

  // Version flag
  if (
    command === "--version" ||
    command === "-v"
  ) {
    printVersion();
    return;
  }

  // Help or no command
  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    printHelp();
    return;
  }

  // Info command
  if (command === "info") {
    printInfo();
    return;
  }

  if (command === "create") {
    // Non-interactive shorthand: kaelum create my-app --template ts-web
    if (maybeName && maybeFlag === "--template" && maybeTemplate) {
      const parsed = parseTemplate(maybeTemplate);
      if (!parsed) {
        console.log(`Unknown template: "${maybeTemplate}"`);
        console.log(`Available templates: js-web, js-api, ts-web, ts-api (or aliases: web, api)`);
        return;
      }
      await createProject({
        projectName: maybeName,
        language: parsed.language,
        template: parsed.template,
      });
      return;
    }

    // Semi-interactive: kaelum create my-app (will ask language + template)
    if (maybeName && !maybeFlag) {
      await createProject({ projectName: maybeName });
      return;
    }

    // Fully interactive
    await createProject();
    return;
  }

  console.log(`Unknown command: "${command}"`);
  printHelp();
}

main().catch((err) => {
  console.error("Error running Kaelum CLI:", err);
  process.exit(1);
});
