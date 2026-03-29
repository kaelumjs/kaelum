const inquirer = require("inquirer");
const inq = inquirer.default || inquirer;
const path = require("path");
const fs = require("fs-extra");
const { copyTemplate } = require("./utils");
const { spawn } = require("child_process");

const templatesDir = path.resolve(__dirname, "templates");

/**
 * runInstall - runs `npm ci` if package-lock exists, otherwise `npm install`
 * @param {string} cwd - target directory where install runs
 * @returns {Promise<void>}
 */
function runInstall(cwd) {
  return new Promise((resolve, reject) => {
    const lockExists = fs.existsSync(path.join(cwd, "package-lock.json"));
    const cmd = "npm";
    const args = lockExists ? ["ci"] : ["install"];

    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("exit", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

/**
 * createProject - create project from template
 * @param {Object} defaults - optional { projectName, language, template, autoInstall }
 */
async function createProject(defaults = {}) {
  console.log("🚀 Welcome to Kaelum CLI!\n");

  try {
    // Ensure templates dir exists
    const templatesExists = await fs.pathExists(templatesDir);
    if (!templatesExists) {
      console.error("❌ Templates directory not found in CLI.");
      return;
    }

    // Gather answers (use defaults when present)
    const questions = [];

    // Project name
    if (!defaults.projectName) {
      questions.push({
        type: "input",
        name: "projectName",
        message: "What is your project name?",
        validate: (input) => (input ? true : "Project name cannot be empty."),
      });
    }

    // Language selection
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

    // Template selection
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

    // Auto install
    questions.push({
      type: "confirm",
      name: "autoInstall",
      message: "Install dependencies now? (recommended)",
      default:
        typeof defaults.autoInstall === "boolean"
          ? defaults.autoInstall
          : true,
    });

    const answers = await inq.prompt(questions);

    // Merge defaults with answers
    const projectName = defaults.projectName || answers.projectName;
    const language = defaults.language || answers.language;
    const template = defaults.template || answers.template;
    const autoInstall = answers.autoInstall;

    const targetDir = path.resolve(process.cwd(), projectName);
    const templateDir = path.join(templatesDir, language, template);

    // Template existence check
    const templateExists = await fs.pathExists(templateDir);
    if (!templateExists) {
      console.error(`\n❌ Template "${language}/${template}" not found.`);
      return;
    }

    if (await fs.pathExists(targetDir)) {
      console.error(
        `\n❌ Folder "${projectName}" already exists. Choose a different name or delete the existing folder.`
      );
      return;
    }

    // Copy template, update package.json, generate .env and .gitignore
    const isTypeScript = language === "ts";
    const result = await copyTemplate(templateDir, targetDir, projectName, {
      isTypeScript,
    });
    if (!result.ok) {
      console.error(`\n❌ Error copying template: ${result.error}`);
      return;
    }

    // Post-creation summary
    const langLabel = language === "ts" ? "TypeScript" : "JavaScript";
    console.log(`\n✅ Project "${projectName}" created successfully!`);
    console.log(`   Language: ${langLabel}`);
    console.log(`   Template: ${template}`);
    console.log(`\n📁 cd ${projectName}`);

    if (autoInstall) {
      console.log("📦 Installing dependencies... (this may take a few minutes)\n");
      try {
        await runInstall(targetDir);
        console.log("\n✅ Dependencies installed successfully!");
        if (isTypeScript) {
          console.log("\n📌 Next steps:");
          console.log(`   npm run dev     Start development server (tsx watch)`);
          console.log(`   npm run build   Compile TypeScript to JavaScript`);
          console.log(`   npm start       Run compiled output\n`);
        } else {
          console.log("\n📌 Next steps:");
          console.log(`   npm start       Start the server`);
          console.log(`   npm run dev     Start with file watching\n`);
        }
      } catch (installErr) {
        console.error(
          "\n❌ Failed to install dependencies automatically:",
          installErr.message || installErr
        );
        console.log(`➡️  Try manually: cd ${projectName} && npm install`);
      }
    } else {
      if (isTypeScript) {
        console.log(`\n📌 Next steps:`);
        console.log(`   cd ${projectName} && npm install`);
        console.log(`   npm run dev     Start development server (tsx watch)`);
        console.log(`   npm run build   Compile TypeScript to JavaScript`);
        console.log(`   npm start       Run compiled output\n`);
      } else {
        console.log(`\n📌 Next steps:`);
        console.log(`   cd ${projectName} && npm install && npm start\n`);
      }
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err.message || err);
  }
}

module.exports = { createProject };
