const express = require("express");
const request = require("supertest");
const redirect = require("../../core/redirect");

describe("core/redirect", () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  test("should register a simple redirect (3-arg form)", async () => {
    redirect(app, "/old", "/new", 301);

    const res = await request(app).get("/old");
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe("/new");
  });

  test("should default to 302 status", async () => {
    redirect(app, "/a", "/b");

    const res = await request(app).get("/a");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/b");
  });

  test("should accept object map of redirects", async () => {
    redirect(app, { "/x": "/y", "/m": "/n" });

    const res1 = await request(app).get("/x");
    expect(res1.status).toBe(302);
    expect(res1.headers.location).toBe("/y");

    const res2 = await request(app).get("/m");
    expect(res2.status).toBe(302);
    expect(res2.headers.location).toBe("/n");
  });

  test("should accept array of redirect objects", async () => {
    redirect(app, [
      { from: "/p", to: "/q", status: 301 },
      { from: "/r", to: "/s" },
    ]);

    const res1 = await request(app).get("/p");
    expect(res1.status).toBe(301);

    const res2 = await request(app).get("/r");
    expect(res2.status).toBe(302);
  });

  test("should return array of registered entries", () => {
    const result = redirect(app, "/from", "/to", 301);
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject({ path: "/from", to: "/to", status: 301 });
  });

  test("should normalize paths without leading slash", async () => {
    redirect(app, "no-slash", "/dest");

    const res = await request(app).get("/no-slash");
    expect(res.status).toBe(302);
  });

  test("should throw on invalid app", () => {
    expect(() => redirect(null, "/a", "/b")).toThrow("Invalid app instance");
  });

  test("should throw on invalid arguments", () => {
    expect(() => redirect(app, 123)).toThrow("Invalid arguments");
  });
});
