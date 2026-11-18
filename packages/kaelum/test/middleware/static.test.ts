import request from "supertest";
import { kaelum, serveStatic } from "../../src/index.js";

// Serves this test folder, so the test file itself is a known static file.
const dir = import.meta.dirname;

describe("serveStatic", () => {
  test("serves files and falls through to routes and the 404", async () => {
    const app = kaelum({ health: false, shutdown: false });
    app.use(serveStatic(dir));
    app.get("/hello", () => "route");

    const file = await request(app.express).get("/static.test.ts");
    expect(file.status).toBe(200);
    expect(Number(file.headers["content-length"])).toBeGreaterThan(0);

    expect((await request(app.express).get("/hello")).text).toBe("route");
    expect((await request(app.express).get("/missing.txt")).body.error.code).toBe("NOT_FOUND");
  });

  test("can be mounted under a prefix, with options", async () => {
    const app = kaelum({ health: false, shutdown: false });
    app.use("/assets", serveStatic(dir, { maxAge: "1d", immutable: true }));

    const res = await request(app.express).get("/assets/static.test.ts");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("public, max-age=86400, immutable");
  });
});
