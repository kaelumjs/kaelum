// Scaffolds every create-kaelum template against the local kaelum build and
// checks it the way a user would: install, test, type-check, build, start.
//
//   pnpm build && node scripts/smoke-templates.mjs [ts-api ts-web ...]
//
// Exits with 1 when any template fails.
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const cli = path.join(root, "packages/create-kaelum/src/index.js");
const all = ["ts-api", "ts-web", "js-api", "js-web"];
const templates = process.argv.slice(2).length ? process.argv.slice(2) : all;
const isWindows = process.platform === "win32";

const work = fs.mkdtempSync(path.join(os.tmpdir(), "kaelum-smoke-"));
const log = (message) => console.log(`\n▸ ${message}`);

function sh(command, cwd) {
  execSync(command, { cwd, stdio: "inherit", env: { ...process.env, CI: "1" } });
}

/** Pack the built kaelum, the way it would be published. */
function packKaelum() {
  log("Packing kaelum");
  sh(`pnpm pack --pack-destination "${work}"`, path.join(root, "packages/kaelum"));
  const tarball = fs.readdirSync(work).find((file) => /^kaelum-.*\.tgz$/.test(file));
  if (!tarball) throw new Error("kaelum tarball not found");
  return path.join(work, tarball);
}

/** Start the app, wait for /health, request `paths`, stop it. */
async function startAndProbe(cwd, port, paths) {
  const child = spawn(isWindows ? "npm.cmd start" : "npm start", {
    cwd,
    shell: true,
    detached: !isWindows,
    env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));

  const stop = () => {
    if (isWindows) execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
    else process.kill(-child.pid, "SIGTERM");
  };

  try {
    const base = `http://127.0.0.1:${port}`;
    let up = false;
    for (let i = 0; i < 50 && !up; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      up = await fetch(`${base}/health`).then((res) => res.ok, () => false);
    }
    if (!up) throw new Error(`the server did not answer /health\n${output}`);

    for (const p of paths) {
      const res = await fetch(base + p);
      if (!res.ok) throw new Error(`GET ${p} answered ${res.status}`);
      if (!res.headers.get("x-request-id")) throw new Error(`GET ${p} has no X-Request-Id`);
      console.log(`  GET ${p} → ${res.status}`);
    }
  } finally {
    stop();
  }
}

async function check(template, tarball, port) {
  const name = `app-${template}`;
  const dir = path.join(work, name);

  log(`${template}: scaffold`);
  sh(`node "${cli}" ${name} --template ${template} --no-install --pm npm`, work);

  // Depend on the local build instead of the published version.
  const pkgFile = path.join(dir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
  pkg.dependencies.kaelum = `file:${tarball}`;
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));

  log(`${template}: install`);
  sh("npm install --no-audit --no-fund --loglevel=error", dir);

  if (template.startsWith("ts")) {
    log(`${template}: typecheck and build`);
    sh("npm run typecheck", dir);
    sh("npm run build", dir);
  }

  // The templates ship no tests; write the one AGENTS.md suggests, to check
  // that testApp loads the app file without starting a server.
  log(`${template}: testApp`);
  const ext = template.startsWith("ts") ? "ts" : "js";
  const probe = template.endsWith("api") ? "/users" : "/about";
  fs.mkdirSync(path.join(dir, "test"));
  fs.writeFileSync(
    path.join(dir, "test", `app.test.${ext}`),
    `import { test } from "node:test";
import assert from "node:assert/strict";
import { testApp } from "kaelum/testing";

test("the app answers", async () => {
  const client = await testApp(() => import("../src/app.${ext}"));
  const res = await client.get("${probe}");
  await client.close();
  assert.equal(res.status, 200);
});
`
  );
  sh(`node --test test/app.test.${ext}`, dir);

  log(`${template}: start`);
  await startAndProbe(dir, port, template.endsWith("api") ? ["/users", "/users/1"] : ["/", "/about", "/style.css", "/dashboard"]);
}

const failed = [];
try {
  const tarball = packKaelum();
  let port = 4600;
  for (const template of templates) {
    try {
      await check(template, tarball, port++);
    } catch (err) {
      console.error(`\n✖ ${template}: ${err.message}`);
      failed.push(template);
    }
  }
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

console.log(failed.length ? `\n✖ Failed: ${failed.join(", ")}` : `\n✔ ${templates.join(", ")} passed`);
process.exitCode = failed.length ? 1 : 0;
