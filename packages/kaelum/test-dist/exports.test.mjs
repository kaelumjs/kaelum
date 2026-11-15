// Runs against the built package (dist/), the way consumers load it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("ESM: default export is the app factory", async () => {
  const { default: kaelum } = await import("kaelum");
  assert.equal(typeof kaelum, "function");

  const app = kaelum();
  assert.equal(typeof app.setConfig, "function");
  assert.equal(typeof app.addRoute, "function");
});

test("CommonJS: require('kaelum') returns the app factory", () => {
  const kaelum = require("kaelum");
  assert.equal(typeof kaelum, "function");

  const app = kaelum();
  assert.equal(typeof app.setConfig, "function");
  assert.equal(typeof app.addRoute, "function");
});

test("subpaths: kaelum/validate and kaelum/test", async () => {
  const { validate } = await import("kaelum/validate");
  assert.equal(typeof validate, "function");
  assert.equal(typeof require("kaelum/validate").validate, "function");

  const { testApp } = await import("kaelum/test");
  assert.equal(typeof testApp, "function");
});

test("ESM: the 2.0 API is exported by name", async () => {
  const { createKaelum, defineRoutes, HttpError, Kaelum, Context } = await import("kaelum");

  const app = createKaelum({ health: false });
  assert.ok(app instanceof Kaelum);
  assert.equal(typeof Context, "function");
  assert.equal(new HttpError(404).status, 404);

  app.route(defineRoutes("/ping")({ get: () => "pong" }));
  assert.deepEqual(app.routes(), [{ method: "GET", path: "/ping" }]);
});
