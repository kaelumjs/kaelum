const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const cli = path.resolve(__dirname, "..", "src", "index.js");
const { version } = require("../package.json");

/** Run the CLI without a terminal, the way CI and scripts do. */
function run(args, cwd, env = {}) {
  // Start clean: the package manager running these tests must not leak in.
  const base = { ...process.env };
  delete base.npm_config_user_agent;
  delete base.CI;
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...base, ...env },
  });
  return { code: result.status, out: result.stdout + result.stderr };
}

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "create-kaelum-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const readPkg = (dir) => JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));

const templates = {
  "ts-api": ["src/app.ts", "src/routes/users.ts", "src/middlewares/auth.ts", "tsconfig.json"],
  "ts-web": ["src/app.ts", "src/routes/pages.ts", "public/index.html", "views/about.ejs", "views/partials/header.ejs", "public/style.css", "tsconfig.json"],
  "js-api": ["src/app.js", "src/routes/users.js", "src/middlewares/auth.js"],
  "js-web": ["src/app.js", "src/routes/pages.js", "public/index.html", "views/about.ejs", "views/partials/header.ejs", "public/style.css"],
};

for (const [template, files] of Object.entries(templates)) {
  test(`scaffolds the ${template} template`, (t) => {
    const cwd = tempDir(t);
    const { code } = run(["my-app", "--template", template, "--no-install"], cwd);
    assert.equal(code, 0);

    const project = path.join(cwd, "my-app");
    for (const file of [...files, "package.json", ".env", ".gitignore", "AGENTS.md", "CLAUDE.md"]) {
      assert.ok(fs.existsSync(path.join(project, file)), `${file} should exist`);
    }

    const pkg = readPkg(project);
    assert.equal(pkg.name, "my-app");
    assert.equal(pkg.type, "module");
    assert.equal(pkg.dependencies.kaelum, `^${version}`, "depends on the matching kaelum release");
    assert.equal("ejs" in pkg.dependencies, template.endsWith("web"), "only the web templates use ejs");
    const sources = fs.readdirSync(path.join(project, "src"), { recursive: true }).map(String);
    assert.ok(!sources.some((file) => /test|server/.test(file)), `one app file, no tests: ${sources}`);
    assert.ok(!fs.existsSync(path.join(project, "node_modules")), "nothing is installed");
  });
}

test("without a terminal, the defaults apply: TypeScript api", (t) => {
  const cwd = tempDir(t);
  const { code } = run(["app", "--no-install"], cwd);
  assert.equal(code, 0);
  assert.ok(fs.existsSync(path.join(cwd, "app", "src", "routes", "users.ts")));
});

test("`api` and `web` pick the TypeScript templates", (t) => {
  const cwd = tempDir(t);
  run(["a", "-t", "api", "--no-install"], cwd);
  run(["w", "-t", "web", "--no-install"], cwd);
  assert.ok(fs.existsSync(path.join(cwd, "a", "src", "routes", "users.ts")));
  assert.ok(fs.existsSync(path.join(cwd, "w", "src", "routes", "pages.ts")));
});

test("the project name is required without a terminal", (t) => {
  const cwd = tempDir(t);
  const { code, out } = run(["--no-install"], cwd);
  assert.equal(code, 1);
  assert.match(out, /Pass a project name/);
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test("a folder name becomes a valid package name", (t) => {
  const cwd = tempDir(t);
  const { code } = run(["My Cool App", "--no-install"], cwd);
  assert.equal(code, 0);
  assert.equal(readPkg(path.join(cwd, "My Cool App")).name, "my-cool-app");
});

test("`.` scaffolds into the current folder when it is empty", (t) => {
  const cwd = tempDir(t);
  const here = path.join(cwd, "here");
  fs.mkdirSync(here);
  const { code } = run([".", "--no-install"], here);
  assert.equal(code, 0);
  assert.equal(readPkg(here).name, "here");
});

test("refuses a folder that is not empty", (t) => {
  const cwd = tempDir(t);
  fs.mkdirSync(path.join(cwd, "taken"));
  fs.writeFileSync(path.join(cwd, "taken", "keep.txt"), "mine");
  const { code, out } = run(["taken", "--no-install"], cwd);
  assert.equal(code, 1);
  assert.match(out, /not empty/);
  assert.deepEqual(fs.readdirSync(path.join(cwd, "taken")), ["keep.txt"]);
});

test("rejects an unknown template or package manager", (t) => {
  const cwd = tempDir(t);
  assert.match(run(["x", "-t", "nope"], cwd).out, /Unknown template/);
  assert.match(run(["x", "--pm", "npx"], cwd).out, /Unknown package manager/);
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test("next steps use the package manager that ran the command", (t) => {
  const cwd = tempDir(t);
  const pnpm = run(["p", "--no-install"], cwd, { npm_config_user_agent: "pnpm/10.0.0 npm/? node/v24.22.1" });
  assert.match(pnpm.out, /pnpm install/);
  assert.match(pnpm.out, /pnpm dev/);
  assert.match(pnpm.out, /pnpm build/);

  const bun = run(["b", "--no-install", "--pm", "bun"], cwd);
  assert.match(bun.out, /bun dev/);

  const npm = run(["n", "--no-install"], cwd);
  assert.match(npm.out, /npm run dev/);
});

test("AGENTS.md uses the project's package manager", (t) => {
  const cwd = tempDir(t);
  run(["p", "--no-install", "--pm", "pnpm"], cwd);
  run(["n", "--no-install"], cwd);

  const pnpm = fs.readFileSync(path.join(cwd, "p", "AGENTS.md"), "utf8");
  assert.match(pnpm, /`pnpm dev`/);
  assert.match(pnpm, /`pnpm typecheck`/);
  assert.doesNotMatch(pnpm, /`npm (run |start)/);

  const npm = fs.readFileSync(path.join(cwd, "n", "AGENTS.md"), "utf8");
  assert.match(npm, /`npm run dev`/);
  assert.match(npm, /`npm start`/);
});

test("prints the version", () => {
  assert.equal(run(["--version"], process.cwd()).out.trim(), `create-kaelum v${version}`);
});
