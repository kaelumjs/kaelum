const { test } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const cli = path.resolve(__dirname, "..", "src", "index.js");

function run(args, cwd) {
  return execFileSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
}

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "create-kaelum-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const templates = {
  "js-web": ["app.js", "routes.js", "views/index.html", "public/style.css"],
  "js-api": ["app.js", "routes.js", "controllers/usersController.js"],
  "ts-web": ["src/app.ts", "src/routes.ts", "tsconfig.json", "views/index.html"],
  "ts-api": ["src/app.ts", "src/routes.ts", "tsconfig.json"],
};

for (const [template, files] of Object.entries(templates)) {
  test(`scaffolds the ${template} template without prompting`, (t) => {
    const cwd = tempDir(t);
    run(["my-app", "--template", template, "--no-install"], cwd);

    const project = path.join(cwd, "my-app");
    for (const file of [...files, "package.json", ".env", ".gitignore"]) {
      assert.ok(fs.existsSync(path.join(project, file)), `${file} should exist`);
    }

    const pkg = JSON.parse(fs.readFileSync(path.join(project, "package.json"), "utf8"));
    assert.equal(pkg.name, "my-app");
    assert.ok(pkg.dependencies.kaelum, "kaelum should be a dependency");
    assert.ok(!fs.existsSync(path.join(project, "node_modules")), "nothing is installed");
  });
}

test("accepts the legacy `api` alias", (t) => {
  const cwd = tempDir(t);
  run(["legacy", "-t", "api", "--no-install"], cwd);
  assert.ok(fs.existsSync(path.join(cwd, "legacy", "controllers", "usersController.js")));
});

test("rejects an unknown template", (t) => {
  const cwd = tempDir(t);
  assert.throws(() => run(["my-app", "--template", "nope", "--no-install"], cwd), /Unknown template/);
  assert.ok(!fs.existsSync(path.join(cwd, "my-app")));
});

test("refuses to overwrite an existing folder", (t) => {
  const cwd = tempDir(t);
  fs.mkdirSync(path.join(cwd, "taken"));
  assert.throws(() => run(["taken", "--template", "js-api", "--no-install"], cwd));
  assert.deepEqual(fs.readdirSync(path.join(cwd, "taken")), []);
});

test("prints the version", () => {
  const { version } = require("../package.json");
  assert.equal(run(["--version"], process.cwd()).trim(), `create-kaelum v${version}`);
});
