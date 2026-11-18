import { after, test } from "node:test";
import assert from "node:assert/strict";
import { testApp } from "kaelum/testing";
import { createApp } from "./app.js";

process.env.NODE_ENV ??= "test"; // quiets the request logs

const client = testApp(createApp());
after(() => client.close());

test("lists users", async () => {
  const res = await client.get("/users");
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 2);
});

test("creating a user needs the API key and a valid body", async () => {
  assert.equal((await client.post("/users", { name: "Carol" })).status, 401);

  const headers = { "x-api-key": "secret" };
  const invalid = await client.post("/users", { name: "C" }, { headers });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, "VALIDATION_ERROR");

  const created = await client.post("/users", { name: "Carol" }, { headers });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body, { id: 3, name: "Carol", role: "user" });
});

test("unknown user is a 404", async () => {
  const res = await client.get("/users/99");
  assert.equal(res.status, 404);
});
