const path = require("node:path");
const { spawn } = require("node:child_process");
const { copyTemplate, pathExists } = require("./utils");
const { version } = require("../package.json");

// kaelum and create-kaelum are released together with the same version, so a
// project scaffolded by this CLI depends on the matching kaelum release.
const kaelumVersion = `^${version}`;

const templatesDir = path.resolve(__dirname, "..", "templates");

/**
 * runInstall - runs `npm ci` if package-lock exists, otherwise `npm install`
 * @param {string} cwd - target directory where install runs
 * @returns {Promise<void>}
 */
async function runInstall(cwd) {
  const lockExists = await pathExists(path.join(cwd, "package-lock.json"));
  const cmd = "npm";
  const args = lockExists ? ["ci"] : ["install"];

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

/**
 * Ask only for what was not provided up front. Returns an empty object, and
 * never loads the prompt library, when there is nothing to ask.
 * @param {Object} defaults
 */
async function askMissing(defaults) {
  const questions = [];

  if (!defaults.projectName) {
    questions.push({
      type: "input",
      name: "projectName",
      message: "What is your project name?",
      validate: (input) => (input ? true : "Project name cannot be empty."),
    });
  }

  if (!defaults.language) {
    questions.push({
      type: "list",
      name: "language",
      message: "Choose your language:",
      choices: [
        { name: "JavaScript", value: "js" },
        { name: "TypeScript", value: "ts" },
      ],
      default: "js",
    });
  }

  if (!defaults.template) {
    questions.push({
      type: "list",
      name: "template",
      message: "Choose your template:",
      choices: [
        { name: "web — MVC with views & static files", value: "web" },
        { name: "api — REST API ready", value: "api" },
      ],
      default: "web",
    });
  }

  if (typeof defaults.autoInstall !== "boolean") {
    questions.push({
      type: "confirm",
      name: "autoInstall",
      message: "Install dependencies now? (recommended)",
      default: true,
    });
  }

  if (questions.length === 0) return {};

  const inquirer = require("inquirer");
  return (inquirer.default || inquirer).prompt(questions);
}

/**
 * createProject - create project from template
 * @param {Object} defaults - optional { projectName, language, template, autoInstall }
 * @returns {Promise<boolean>} true when the project was created
 */
async function createProject(defaults = {}) {
  console.log("🚀 Welcome to Kaelum!\n");

  try {
    const answers = await askMissing(defaults);

    const projectName = defaults.projectName || answers.projectName;
    const language = defaults.language || answers.language;
    const template = defaults.template || answers.template;
    const autoInstall =
      typeof defaults.autoInstall === "boolean" ? defaults.autoInstall : answers.autoInstall;

    const targetDir = path.resolve(process.cwd(), projectName);
    const templateDir = path.join(templatesDir, language, template);

    if (!(await pathExists(templateDir))) {
      console.error(`\n❌ Template "${language}/${template}" not found.`);
      return false;
    }

    if (await pathExists(targetDir)) {
      console.error(
        `\n❌ Folder "${projectName}" already exists. Choose a different name or delete the existing folder.`
      );
      return false;
    }

    // Copy template, update package.json, generate .env and .gitignore
    const isTypeScript = language === "ts";
    const result = await copyTemplate(
      templateDir,
      targetDir,
      path.basename(targetDir),
      kaelumVersion
    );
    if (!result.ok) {
      console.error(`\n❌ Error copying template: ${result.error}`);
      return false;
    }

    // Post-creation summary
    const langLabel = isTypeScript ? "TypeScript" : "JavaScript";
    console.log(`\n✅ Project "${projectName}" created successfully!`);
    console.log(`   Language: ${langLabel}`);
    console.log(`   Template: ${template}`);
    console.log(`\n📁 cd ${projectName}`);

    if (autoInstall) {
      console.log("📦 Installing dependencies... (this may take a few minutes)\n");
      try {
        await runInstall(targetDir);
        console.log("\n✅ Dependencies installed successfully!");
        printNextSteps({ isTypeScript });
      } catch (installErr) {
        console.error(
          "\n❌ Failed to install dependencies automatically:",
          installErr.message || installErr
        );
        console.log(`➡️  Try manually: cd ${projectName} && npm install`);
      }
    } else {
      printNextSteps({ isTypeScript, install: `cd ${projectName} && npm install` });
    }

    return true;
  } catch (err) {
    console.error("❌ Unexpected error:", err.message || err);
    return false;
  }
}

function printNextSteps({ isTypeScript, install }) {
  console.log("\n📌 Next steps:");
  if (install) console.log(`   ${install}`);
  if (isTypeScript) {
    console.log(`   npm run dev     Start development server (tsx watch)`);
    console.log(`   npm run build   Compile TypeScript to JavaScript`);
    console.log(`   npm start       Run compiled output\n`);
  } else {
    console.log(`   npm start       Start the server`);
    console.log(`   npm run dev     Start with file watching\n`);
  }
}

module.exports = { createProject };
