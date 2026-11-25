const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  detectPackageManager,
  parseTemplate,
  runScript,
  toPackageName,
  validateProjectName,
} = require("../src/options");

test("parseTemplate", () => {
  assert.deepEqual(parseTemplate("ts-api"), { language: "ts", kind: "api" });
  assert.deepEqual(parseTemplate("js-web"), { language: "js", kind: "web" });
  assert.deepEqual(parseTemplate("web"), { language: "ts", kind: "web" });
  assert.equal(parseTemplate("express"), null);
});

test("detectPackageManager reads npm_config_user_agent", () => {
  assert.equal(detectPackageManager("pnpm/10.2.0 npm/? node/v24.22.1 win32 x64"), "pnpm");
  assert.equal(detectPackageManager("yarn/4.5.0 npm/? node/v24.22.1"), "yarn");
  assert.equal(detectPackageManager("bun/1.2.0 npm/? node/v24.22.1"), "bun");
  assert.equal(detectPackageManager("npm/11.0.0 node/v24.22.1"), "npm");
  assert.equal(detectPackageManager(""), "npm");
  assert.equal(detectPackageManager("deno/2.0"), "npm");
});

test("runScript", () => {
  assert.equal(runScript("npm", "dev"), "npm run dev");
  assert.equal(runScript("npm", "test"), "npm test");
  assert.equal(runScript("pnpm", "dev"), "pnpm dev");
  assert.equal(runScript("yarn", "test"), "yarn test");
});

test("toPackageName", () => {
  assert.equal(toPackageName("My Cool App"), "my-cool-app");
  assert.equal(toPackageName("_private"), "private");
  assert.equal(toPackageName("app!!v2"), "app-v2");
  assert.equal(toPackageName("???"), "kaelum-app");
});

test("validateProjectName", () => {
  assert.equal(validateProjectName("my-app"), undefined);
  assert.equal(validateProjectName("."), undefined);
  assert.equal(validateProjectName("apps/my-app"), undefined);
  assert.match(validateProjectName("   "), /Enter a project name/);
  assert.match(validateProjectName("a".repeat(215)), /too long/);
});
