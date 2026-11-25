import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { HttpError, kaelum, type KaelumOptions, type LogEntry, type Middleware } from "../src/index.js";

const fixtures = path.join(import.meta.dirname, "fixtures");
const base = { health: false, shutdown: false } as const;
const make = (options: KaelumOptions = {}) => kaelum({ ...base, ...options });

describe("static", () => {
  // Built per run, so the tests never depend on files that could go missing.
  let root: string;
  let publicDir: string;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "kaelum-static-"));
    publicDir = path.join(root, "public");
    fs.mkdirSync(path.join(publicDir, "css"), { recursive: true });
    fs.writeFileSync(path.join(publicDir, "hello.txt"), "hello from public\n");
    fs.writeFileSync(path.join(publicDir, "css", "site.css"), "body { margin: 0 }\n");
  });

  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  test("serves a folder, falls through to routes and the 404", async () => {
    const app = make({ static: publicDir });
    app.get("/api", () => "route");

    const file = await request(app.express).get("/hello.txt");
    expect(file.status).toBe(200);
    expect(file.text).toBe("hello from public\n");
    expect((await request(app.express).get("/css/site.css")).headers["content-type"]).toMatch(/css/);
    expect((await request(app.express).get("/api")).text).toBe("route");
    expect((await request(app.express).get("/missing.txt")).body.error.code).toBe("NOT_FOUND");
  });

  test("a prefix and cache options", async () => {
    const app = make({ static: { dir: publicDir, prefix: "/assets", maxAge: "1d" } });

    expect((await request(app.express).get("/hello.txt")).status).toBe(404);
    const res = await request(app.express).get("/assets/hello.txt");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("public, max-age=86400");
  });

  test("relative folders resolve from the project root", async () => {
    const cwd = process.cwd();
    process.chdir(root);
    try {
      const app = make({ static: "public" });
      expect((await request(app.express).get("/hello.txt")).status).toBe(200);
    } finally {
      process.chdir(cwd);
    }
  });
});

describe("views and c.render", () => {
  const views = { dir: path.join(fixtures, "views") };

  test("renders a view with data, includes and res.locals", async () => {
    const setUser: Middleware = (_req, res, next) => {
      res.locals.user = "ada";
      next();
    };
    const app = make({ views });
    app.get("/", { use: [setUser], handler: (c) => c.render("home", { title: "Welcome", name: "Ada" }) });

    const res = await request(app.express).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("<h1>Welcome</h1>");
    expect(res.text).toContain("Hello, Ada. User: ada");
  });

  test("data is escaped", async () => {
    const app = make({ views });
    app.get("/", (c) => c.render("home", { title: "<script>", name: "x" }));

    expect((await request(app.express).get("/")).text).toContain("&lt;script&gt;");
  });

  test("a status can be passed", async () => {
    const app = make({ views });
    app.get("/", (c) => c.render("home", { title: "t", name: "n" }, 202));
    expect((await request(app.express).get("/")).status).toBe(202);
  });

  test("a missing view is a 500, logged", async () => {
    const entries: LogEntry[] = [];
    const app = make({ views, observability: { logger: (e) => entries.push(e) } });
    app.get("/", (c) => c.render("nope"));

    expect((await request(app.express).get("/")).status).toBe(500);
    expect(String((entries[0]?.data?.err as Error).message)).toMatch(/Failed to lookup view "nope"/);
  });

  test("c.render without views explains what to enable", async () => {
    const entries: LogEntry[] = [];
    const app = make({ observability: { logger: (e) => entries.push(e) } });
    app.get("/", (c) => c.render("home"));

    expect((await request(app.express).get("/")).status).toBe(500);
    expect(String((entries[0]?.data?.err as Error).message)).toMatch(/kaelum\(\{ views: true \}\)/);
  });

  test("an engine that is not installed fails when the app is created", () => {
    expect(() => make({ views: { engine: "not-a-view-engine" } })).toThrow(
      /"not-a-view-engine" package is not installed\. Run: npm install not-a-view-engine/
    );
  });
});

describe("port", () => {
  test("start() uses `port` when PORT is not set", async () => {
    const saved = process.env.PORT;
    delete process.env.PORT;
    const app = make({ port: 0 });
    try {
      const server = await app.start();
      expect(server.listening).toBe(true);
    } finally {
      await app.close();
      if (saved !== undefined) process.env.PORT = saved;
    }
  });
});

describe("etag", () => {
  const body = () => [{ id: 1 }];

  test("weak by default, with 304 on a matching If-None-Match", async () => {
    const app = make();
    app.get("/", body);

    const first = await request(app.express).get("/");
    expect(first.headers.etag).toMatch(/^W\//);
    const again = await request(app.express).get("/").set("If-None-Match", first.headers.etag ?? "");
    expect(again.status).toBe(304);
  });

  test("strong or off", async () => {
    const strong = make({ etag: "strong" });
    strong.get("/", body);
    expect((await request(strong.express).get("/")).headers.etag).toMatch(/^"/);

    const off = make({ etag: false });
    off.get("/", body);
    expect((await request(off.express).get("/")).headers.etag).toBeUndefined();
  });
});

describe("json.pretty", () => {
  test("true indents every JSON response, errors included", async () => {
    const app = make({ json: { pretty: true } });
    app.get("/", () => ({ a: 1 }));

    expect((await request(app.express).get("/")).text).toBe('{\n  "a": 1\n}');
    expect((await request(app.express).get("/missing")).text).toContain('\n  "error"');
  });

  test('"query" indents only with ?pretty', async () => {
    const app = make({ json: { pretty: "query" } });
    app.get("/", () => ({ a: 1 }));

    expect((await request(app.express).get("/")).text).toBe('{"a":1}');
    const pretty = await request(app.express).get("/?pretty");
    expect(pretty.text).toBe('{\n  "a": 1\n}');
    expect(pretty.headers["content-type"]).toMatch(/application\/json/);
  });
});

describe("trailingSlash", () => {
  test('"redirect" sends GET and HEAD to the URL without the slash, keeping the query', async () => {
    const app = make({ trailingSlash: "redirect" });
    app.route("/users", { get: () => [], post: (c) => c.created() });

    const res = await request(app.express).get("/users/?page=2");
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe("/users?page=2");
    expect((await request(app.express).get("/")).status).not.toBe(301);
    expect((await request(app.express).post("/users/")).status).toBe(201);
  });

  test("off by default: both URLs reach the route", async () => {
    const app = make();
    app.get("/users", () => []);
    expect((await request(app.express).get("/users/")).status).toBe(200);
  });
});

describe("redirects", () => {
  test("302 by default, or the given status", async () => {
    const app = make({ redirects: { "/blog": "/articles", "/old": { to: "/new", status: 301 } } });

    const blog = await request(app.express).get("/blog");
    expect(blog.status).toBe(302);
    expect(blog.headers.location).toBe("/articles");

    const old = await request(app.express).get("/old");
    expect(old.status).toBe(301);
    expect(old.headers.location).toBe("/new");

    expect((await request(app.express).get("/blog/post")).status).toBe(404);
  });
});

describe("notFound", () => {
  test("its return value is sent with a 404", async () => {
    const app = make({ notFound: (c) => ({ missing: c.req.path }) });

    const res = await request(app.express).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ missing: "/nope" });
  });

  test("returning nothing keeps the default body", async () => {
    const app = make({ notFound: () => undefined });
    expect((await request(app.express).get("/nope")).body.error.code).toBe("NOT_FOUND");
  });

  test("can render a view, keeping the 404", async () => {
    const app = make({ views: { dir: path.join(fixtures, "views") }, notFound: (c) => c.render("404") });

    const res = await request(app.express).get("/nope");
    expect(res.status).toBe(404);
    expect(res.text).toContain("Not here");
  });

  test("does not replace the 405 for a known path", async () => {
    const app = make({ notFound: () => "custom" });
    app.get("/users", () => []);
    expect((await request(app.express).post("/users")).status).toBe(405);
  });
});

describe("onError", () => {
  const failing = (app: ReturnType<typeof make>) => {
    app.get("/http", () => {
      throw new HttpError(409, "Taken");
    });
    app.get("/boom", () => {
      throw new Error("db down");
    });
    return app;
  };

  test("can replace the response, keeping the error status", async () => {
    const app = failing(make({ onError: (err) => ({ handled: (err as Error).message }) }));

    const http = await request(app.express).get("/http");
    expect(http.status).toBe(409);
    expect(http.body).toEqual({ handled: "Taken" });

    const boom = await request(app.express).get("/boom");
    expect(boom.status).toBe(500);
    expect(boom.body).toEqual({ handled: "db down" });
  });

  test("returning nothing keeps the default response; unexpected errors are still logged", async () => {
    const seen: unknown[] = [];
    const entries: LogEntry[] = [];
    const app = failing(
      make({ onError: (err) => void seen.push(err), observability: { logger: (e) => entries.push(e) } })
    );

    expect((await request(app.express).get("/http")).body.error).toEqual({ code: "CONFLICT", message: "Taken" });
    expect((await request(app.express).get("/boom")).body.error.code).toBe("INTERNAL_ERROR");
    expect(seen).toHaveLength(2);
    expect(entries.map((e) => e.message)).toEqual(["Unhandled error in GET /boom"]);
  });

  test("sees 404s and validation errors too", async () => {
    const codes: string[] = [];
    const app = make({ onError: (err) => void codes.push((err as HttpError).code) });
    app.post("/x", { body: { "~standard": { version: 1, vendor: "t", validate: () => ({ issues: [{ message: "bad" }] }) } }, handler: () => "ok" });

    await request(app.express).get("/nope");
    await request(app.express).post("/x");
    expect(codes).toEqual(["NOT_FOUND", "VALIDATION_ERROR"]);
  });

  test("a failing onError is logged and the default response is sent", async () => {
    const entries: LogEntry[] = [];
    const app = failing(
      make({
        onError: () => {
          throw new Error("hook broke");
        },
        observability: { logger: (e) => entries.push(e) },
      })
    );

    const res = await request(app.express).get("/http");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
    expect(entries.map((e) => e.message)).toContain("onError failed");
  });
});
