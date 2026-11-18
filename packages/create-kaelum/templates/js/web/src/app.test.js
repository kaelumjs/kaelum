import { after, test } from "node:test";
import assert from "node:assert/strict";
import { testApp } from "kaelum/testing";
import { createApp } from "./app.js";

process.env.NODE_ENV ??= "test"; // quiets the request logs

const client = testApp(createApp());
after(() => client.close());

test("home page", async () => {
  const res = await client.get("/");
  assert.equal(res.status, 200);
  assert.match(res.text, /Kaelum/);
});

test("static files", async () => {
  const res = await client.get("/style.css");
  assert.equal(res.status, 200);
});

test("dashboard goes through the login middleware", async () => {
  const res = await client.get("/dashboard");
  assert.match(res.text, /Welcome, Admin/);
});
