const request = require("supertest");
const createApp = require("../../createApp");
const express = require("express");

describe("core/notFound", () => {
  it("app.notFound() returns a default JSON 404 response", async () => {
    const app = createApp();
    
    app.addRoute("/hello", {
      get: (req, res) => res.json({ msg: "hello" }),
    });

    app.notFound();

    const res = await request(app).get("/unknown");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "Not Found",
      path: "/unknown",
    });
  });

  it("app.notFound() accepts a custom handler", async () => {
    const app = createApp();
    
    app.notFound((req, res) => {
      res.status(404).json({ customError: "Where are you going?", target: req.path });
    });

    const res = await request(app).get("/lost");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      customError: "Where are you going?",
      target: "/lost",
    });
  });

  it("app.useMethodNotAllowed() returns 405 with Allow header for raw app.get", async () => {
    const app = createApp();
    
    // Test with raw express routes
    app.get("/hello", (req, res) => res.json({ msg: "hello" }));
    app.put("/hello", (req, res) => res.json({ msg: "hello put" }));

    app.useMethodNotAllowed();
    app.notFound();

    const res = await request(app).post("/hello");
    expect(res.status).toBe(405);
    // The methods could be returned in any order depending on insertion
    const allowed = res.headers["allow"].split(", ");
    expect(allowed).toContain("GET");
    expect(allowed).toContain("PUT");
    
    expect(res.body).toEqual({
      error: "Method Not Allowed",
      allowed: expect.arrayContaining(["GET", "PUT"]),
      path: "/hello",
    });
  });

  it("app.useMethodNotAllowed() handles Kaelum addRoute correctly", async () => {
    const app = createApp();
    
    app.addRoute("/users", {
      get: (req, res) => res.json([]),
      post: (req, res) => res.json({ created: true }),
    });

    app.useMethodNotAllowed();
    app.notFound();

    const res = await request(app).put("/users");
    expect(res.status).toBe(405);
    const allowed = res.headers["allow"].split(", ");
    expect(allowed).toContain("GET");
    expect(allowed).toContain("POST");
  });

  it("app.useMethodNotAllowed() handles Kaelum groups correctly", async () => {
    const app = createApp();
    
    const api = app.group("/api");
    api.addRoute("/data", {
      patch: (req, res) => res.json({ patched: true }),
      delete: (req, res) => res.status(204).send(),
    });

    app.useMethodNotAllowed();
    app.notFound();

    const res = await request(app).get("/api/data");
    expect(res.status).toBe(405);
    const allowed = res.headers["allow"].split(", ");
    expect(allowed).toContain("PATCH");
    expect(allowed).toContain("DELETE");
    
    expect(res.body.path).toBe("/api/data");
  });

  it("app.useMethodNotAllowed() falls back to 404 if path does not exist anywhere", async () => {
    const app = createApp();
    
    app.addRoute("/exists", { get: (req, res) => res.send("ok") });
    
    app.useMethodNotAllowed();
    app.notFound();

    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
  });

  it("app.useMethodNotAllowed() accepts a custom handler", async () => {
    const app = createApp();
    
    app.addRoute("/restricted", { delete: (req, res) => res.send("deleted") });
    
    app.useMethodNotAllowed({
      handler: (req, res, allowedMethods) => {
        res.status(405).json({
          message: "You can't do that here",
          tryThese: allowedMethods
        });
      }
    });

    const res = await request(app).get("/restricted");
    expect(res.status).toBe(405);
    expect(res.body).toEqual({
      message: "You can't do that here",
      tryThese: ["DELETE"],
    });
  });
});
