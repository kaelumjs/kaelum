// Pure helpers for the CLI's inputs: templates, package managers, project names.
const path = require("node:path");

const TEMPLATES = {
  "ts-api": { language: "ts", kind: "api" },
  "ts-web": { language: "ts", kind: "web" },
  "js-api": { language: "js", kind: "api" },
  "js-web": { language: "js", kind: "web" },
};

// Short names pick the TypeScript variant, the default since 2.0.
const TEMPLATE_ALIASES = { api: "ts-api", web: "ts-web" };

const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"];

/** "ts-api", "api", ... → { language, kind }, or null when unknown. */
function parseTemplate(value) {
  return TEMPLATES[TEMPLATE_ALIASES[value] || value] || null;
}

/** The package manager that launched the CLI (`npm create`, `pnpm create`, ...). */
function detectPackageManager(userAgent = process.env.npm_config_user_agent || "") {
  const name = userAgent.split("/")[0];
  return PACKAGE_MANAGERS.includes(name) ? name : "npm";
}

/** Command to run a package script: `npm run dev`, `pnpm dev`, ... */
function runScript(pm, script) {
  if (pm !== "npm") return `${pm} ${script}`;
  return script === "test" || script === "start" ? `npm ${script}` : `npm run ${script}`;
}

const VALID_NAME = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/** Turn a folder name into a valid npm package name. */
function toPackageName(folder) {
  return (
    folder
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/^[._]+/, "")
      .replace(/[^a-z0-9-~._]+/g, "-")
      .replace(/^-+|-+$/g, "") || "kaelum-app"
  );
}

/**
 * Check what the user typed as the project location. Returns an error
 * message, or undefined when it is usable.
 */
function validateProjectName(input) {
  const value = (input || "").trim();
  if (!value) return "Enter a project name.";
  if (value === ".") return undefined;
  const name = path.basename(value);
  if (name.length > 214) return "The name is too long.";
  if (!VALID_NAME.test(toPackageName(name))) return "Use letters, numbers and dashes.";
  return undefined;
}

module.exports = {
  PACKAGE_MANAGERS,
  TEMPLATES,
  TEMPLATE_ALIASES,
  detectPackageManager,
  parseTemplate,
  runScript,
  toPackageName,
  validateProjectName,
};
