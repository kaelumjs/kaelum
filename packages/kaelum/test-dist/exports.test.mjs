// Runs against the built package (dist/), the way consumers load it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("ESM: default export and named `kaelum` create an app", async () => {
  const mod = await import("kaelum");
  assert.equal(mod.default, mod.kaelum);

  const app = mod.default({ health: false, shutdown: false });
  assert.ok(app instanceof mod.Kaelum);
});

test("CommonJS: require('kaelum') gives the named exports", () => {
  const { kaelum, Kaelum } = require("kaelum");
  assert.ok(kaelum({ health: false, shutdown: false }) instanceof Kaelum);
});

test("the 1.x subpaths are gone", async () => {
  await assert.rejects(import("kaelum/validate"), { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
  await assert.rejects(import("kaelum/test"), { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
});

test("named exports", async () => {
  const { kaelum, HttpError, Context, k, rateLimit, ipRestriction, serveStatic } = await import("kaelum");

  assert.equal(typeof Context, "function");
  assert.equal(new HttpError(404).status, 404);
  assert.equal(typeof k.string, "function");
  assert.equal(typeof rateLimit(), "function");
  assert.equal(typeof ipRestriction(), "function");
  assert.equal(typeof serveStatic("."), "function");

  const app = kaelum({ health: false, shutdown: false });
  app.route("/ping", { get: () => "pong" });
  assert.deepEqual(app.routes(), [{ method: "GET", path: "/ping" }]);
});

test("subpath: kaelum/testing drives an app", async () => {
  const { kaelum } = await import("kaelum");
  const { testApp } = await import("kaelum/testing");

  const app = kaelum({ shutdown: false, observability: { logs: false } });
  app.resource("/users", { get: (c) => ({ id: c.params.id }) });

  const client = testApp(app);
  const res = await client.get("/users/7");
  await client.close();

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { id: "7" });
});
