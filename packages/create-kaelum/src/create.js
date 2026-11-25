const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");
const prompts = require("@clack/prompts");
const { copyTemplate } = require("./utils");
const { runScript, toPackageName, validateProjectName } = require("./options");
const { version } = require("../package.json");

// kaelum and create-kaelum are released together with the same version, so a
// project scaffolded by this CLI depends on the matching kaelum release.
const kaelumVersion = `^${version}`;

const templatesDir = path.resolve(__dirname, "..", "templates");

const DEFAULTS = { language: "ts", kind: "api", install: true };

class Cancelled extends Error {}

/** Same calls as a spinner, printed as plain log lines. */
function quietSpinner() {
  return {
    start: (message) => prompts.log.step(message),
    stop: (message) => prompts.log.success(message),
    error: (message) => prompts.log.error(message),
  };
}

/** Return the prompt's answer, or stop when the user pressed Ctrl+C. */
function answer(value) {
  if (prompts.isCancel(value)) throw new Cancelled();
  return value;
}

/**
 * Fill in whatever the flags did not give. Asks only when `interactive`;
 * otherwise falls back to the defaults (TypeScript, api, install).
 */
async function resolveOptions(given, interactive) {
  const options = { ...given };

  if (!options.projectName) {
    if (!interactive) throw new Error("Pass a project name, e.g. `npm create kaelum@next my-app`.");
    options.projectName = answer(
      await prompts.text({
        message: "Project name",
        placeholder: "my-kaelum-app",
        defaultValue: "my-kaelum-app",
        validate: (value) => (value ? validateProjectName(value) : undefined),
      })
    );
  }

  if (!options.kind) {
    options.kind = interactive
      ? answer(
          await prompts.select({
            message: "What are you building?",
            options: [
              { value: "api", label: "API", hint: "REST API with validation and an auth example" },
              { value: "web", label: "Web app", hint: "pages, a view and static files" },
            ],
          })
        )
      : DEFAULTS.kind;
  }

  if (!options.language) {
    options.language = interactive
      ? answer(
          await prompts.select({
            message: "Language",
            options: [
              { value: "ts", label: "TypeScript", hint: "recommended" },
              { value: "js", label: "JavaScript" },
            ],
          })
        )
      : DEFAULTS.language;
  }

  if (typeof options.install !== "boolean") {
    options.install = interactive
      ? answer(await prompts.confirm({ message: `Install dependencies with ${options.pm}?` }))
      : DEFAULTS.install;
  }

  return options;
}

/** AGENTS.md is written with npm commands; use the project's package manager instead. */
async function adaptAgentsFile(dir, pm) {
  if (pm === "npm") return;
  const file = path.join(dir, "AGENTS.md");
  let text;
  try {
    text = await fs.readFile(file, "utf8");
  } catch {
    return;
  }
  const adapted = text.replace(/`npm (?:run )?([\w:-]+)`/g, (_, script) => `\`${runScript(pm, script)}\``);
  await fs.writeFile(file, adapted);
}

/** The target folder must not exist, or be empty. */
async function checkTarget(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  if (entries.length > 0) {
    throw new Error(`${path.relative(process.cwd(), dir) || "This folder"} is not empty. Pick another name.`);
  }
}

/** Run `<pm> install`, collecting the output to show it only on failure. */
function install(pm, cwd) {
  return new Promise((resolve, reject) => {
    // On Windows npm and friends are .cmd scripts, which need a shell. `pm`
    // comes from a fixed list, so the command string is safe to pass whole.
    const child =
      process.platform === "win32"
        ? spawn(`${pm} install`, { cwd, shell: true, stdio: ["ignore", "pipe", "pipe"] })
        : spawn(pm, ["install"], { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(Object.assign(new Error(`${pm} install failed`), { output }))
    );
  });
}

/**
 * Create a project.
 * @param {{ projectName?: string, language?: string, kind?: string, install?: boolean, pm: string }} given
 * @param {{ interactive: boolean }} mode
 * @returns {Promise<boolean>} true when the project was created
 */
async function createProject(given, { interactive }) {
  prompts.intro(`create-kaelum v${version}`);

  try {
    const options = await resolveOptions(given, interactive);
    const problem = validateProjectName(options.projectName);
    if (problem) throw new Error(problem);

    const targetDir = path.resolve(process.cwd(), options.projectName.trim());
    await checkTarget(targetDir);

    const template = `${options.language}-${options.kind}`;
    const result = await copyTemplate(
      path.join(templatesDir, options.language, options.kind),
      targetDir,
      toPackageName(path.basename(targetDir)),
      kaelumVersion
    );
    if (!result.ok) throw new Error(result.error);
    await adaptAgentsFile(targetDir, options.pm);

    const where = path.relative(process.cwd(), targetDir) || ".";
    prompts.log.success(`Created ${where} from the ${template} template.`);

    let installed = false;
    if (options.install) {
      // Without a terminal (CI logs) a spinner only prints noise.
      const spin = process.stdout.isTTY ? prompts.spinner() : quietSpinner();
      spin.start(`Installing dependencies with ${options.pm}`);
      try {
        await install(options.pm, targetDir);
        spin.stop("Dependencies installed");
        installed = true;
      } catch (err) {
        spin.error(`${options.pm} install failed`);
        if (err.output) prompts.log.message(err.output.trim().split("\n").slice(-15).join("\n"));
      }
    }

    const commands = [
      [runScript(options.pm, "dev"), "start with file watching"],
      options.language === "ts"
        ? [runScript(options.pm, "build"), "compile for production"]
        : [runScript(options.pm, "start"), "start without watching"],
    ];
    const width = Math.max(...commands.map(([cmd]) => cmd.length)) + 3;
    const steps = [
      where !== "." && `cd ${where}`,
      !installed && `${options.pm} install`,
      ...commands.map(([cmd, what]) => cmd.padEnd(width) + what),
    ].filter(Boolean);
    prompts.note(steps.join("\n"), "Next steps");
    prompts.outro("Docs: https://kaelumjs.matthcodes.dev");
    return true;
  } catch (err) {
    if (err instanceof Cancelled) {
      prompts.cancel("Cancelled. Nothing was created.");
    } else {
      prompts.log.error(err.message || String(err));
      prompts.outro("Nothing was created.");
    }
    return false;
  }
}

module.exports = { createProject };
