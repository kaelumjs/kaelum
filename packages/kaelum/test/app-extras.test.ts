import request from "supertest";
import { kaelum, k, type LogEntry, type Middleware, type Plugin } from "../src/index.js";

const quiet = { health: false, shutdown: false } as const;

describe("app.resource", () => {
  test("maps the actions to CRUD routes", async () => {
    const app = kaelum(quiet);
    app.resource("/users", {
      list: () => [{ id: "1" }],
      create: (c) => c.created(c.body),
      get: (c) => ({ id: c.params.id }),
      update: (c) => ({ id: c.params.id, patched: true }),
      replace: (c) => ({ id: c.params.id, replaced: true }),
      remove: (c) => c.noContent(),
    });

    expect(app.routes()).toEqual([
      { method: "GET", path: "/users" },
      { method: "POST", path: "/users" },
      { method: "GET", path: "/users/:id" },
      { method: "PATCH", path: "/users/:id" },
      { method: "PUT", path: "/users/:id" },
      { method: "DELETE", path: "/users/:id" },
    ]);

    expect((await request(app.express).get("/users")).body).toEqual([{ id: "1" }]);
    expect((await request(app.express).post("/users").send({ name: "Ada" })).status).toBe(201);
    expect((await request(app.express).get("/users/7")).body).toEqual({ id: "7" });
    expect((await request(app.express).patch("/users/7")).body).toEqual({ id: "7", patched: true });
    expect((await request(app.express).put("/users/7")).body).toEqual({ id: "7", replaced: true });
    expect((await request(app.express).delete("/users/7")).status).toBe(204);
  });

  test("only the given actions are registered", async () => {
    const app = kaelum(quiet);
    app.resource("/posts", { list: () => [] });

    expect(app.routes()).toEqual([{ method: "GET", path: "/posts" }]);
    expect((await request(app.express).post("/posts")).status).toBe(405);
    expect((await request(app.express).get("/posts/1")).status).toBe(404);
  });

  test("`use` applies to every action, and endpoint objects validate", async () => {
    const seen: string[] = [];
    const track: Middleware = (req, _res, next) => {
      seen.push(`${req.method} ${req.path}`);
      next();
    };

    const app = kaelum(quiet);
    app.resource("/items", {
      use: [track],
      create: { body: k.object({ name: k.string() }), handler: (c) => c.created({ name: c.body.name }) },
      get: (c) => c.params.id,
    });

    expect((await request(app.express).post("/items").send({ name: 1 })).status).toBe(400);
    expect((await request(app.express).post("/items").send({ name: "x" })).body).toEqual({ name: "x" });
    await request(app.express).get("/items/3");
    expect(seen).toEqual(["POST /items", "POST /items", "GET /items/3"]);
  });

  test("rejects unknown keys and non-objects", () => {
    const app = kaelum(quiet);
    expect(() => app.resource("/x", { index: () => [] } as never)).toThrow(/unknown key "index"/);
    expect(() => app.resource("/x", null as never)).toThrow(/expected an object of actions/);
    expect(app.routes()).toEqual([]);
  });
});

describe("method shortcuts", () => {
  test("register a single endpoint each", async () => {
    const app = kaelum(quiet);
    app
      .get("/a/:id", (c) => ({ id: c.params.id }))
      .post("/a", { body: k.object({ n: k.number() }), handler: (c) => c.created({ n: c.body.n }) })
      .put("/a/:id", () => "put")
      .patch("/a/:id", () => "patch")
      .delete("/a/:id", (c) => c.noContent());

    expect((await request(app.express).get("/a/1")).body).toEqual({ id: "1" });
    expect((await request(app.express).post("/a").send({ n: 2 })).body).toEqual({ n: 2 });
    expect((await request(app.express).post("/a").send({ n: "2" })).status).toBe(400);
    expect((await request(app.express).put("/a/1")).text).toBe("put");
    expect((await request(app.express).patch("/a/1")).text).toBe("patch");
    expect((await request(app.express).delete("/a/1")).status).toBe(204);
  });

  test("share the route table with app.route", () => {
    const app = kaelum(quiet);
    app.route("/a", { get: () => "x" });
    expect(() => app.get("/a", () => "y")).toThrow(/GET \/a is already registered/);
  });
});

describe("app.plugin", () => {
  test("runs the plugin with the app and its options", async () => {
    const hello: Plugin<{ path: string }> = (app, { path }) => {
      app.route(path, { get: () => "hello" });
    };

    const app = kaelum(quiet);
    expect(app.plugin(hello, { path: "/hi" })).toBe(app);
    expect((await request(app.express).get("/hi")).text).toBe("hello");
  });

  test("options are optional when the plugin takes none", () => {
    const calls: unknown[] = [];
    const plain: Plugin = (_app, options) => void calls.push(options);

    kaelum(quiet).plugin(plain);
    expect(calls).toEqual([undefined]);
  });

  test("rejects anything that is not a function", () => {
    expect(() => kaelum(quiet).plugin({} as never)).toThrow(/expected a function/);
  });
});

describe("close and onClose", () => {
  test("hooks run in order, after the server stopped", async () => {
    const order: string[] = [];
    const app = kaelum(quiet);
    app.onClose(() => void order.push("first"));
    app.onClose(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      order.push("second");
    });

    const server = await app.start(0);
    await app.close();

    expect(server.listening).toBe(false);
    expect(order).toEqual(["first", "second"]);
  });

  test("a failing hook is logged and does not stop the others", async () => {
    const entries: LogEntry[] = [];
    const ran: string[] = [];
    const app = kaelum({ ...quiet, observability: { logger: (entry) => entries.push(entry) } });
    app.onClose(() => {
      throw new Error("db gone");
    });
    app.onClose(() => void ran.push("after"));

    await app.close();

    expect(ran).toEqual(["after"]);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ level: "error", message: "onClose hook failed" });
    expect((entries[0]?.data?.err as Error).message).toBe("db gone");
  });

  test("concurrent close() calls share one shutdown", async () => {
    let runs = 0;
    const app = kaelum(quiet);
    app.onClose(() => void runs++);

    await app.start(0);
    await Promise.all([app.close(), app.close()]);

    expect(runs).toBe(1);
  });

  test("connections still open after the timeout are cut", async () => {
    const app = kaelum({ health: false, shutdown: { timeout: 50, signals: [] } });
    app.route("/hang", { get: () => new Promise(() => {}) });

    const server = await app.start(0);
    const { port } = server.address() as { port: number };
    const pending = fetch(`http://127.0.0.1:${port}/hang`).catch((err: unknown) => err);
    await new Promise((resolve) => setTimeout(resolve, 20));

    const started = Date.now();
    await app.close();

    expect(Date.now() - started).toBeLessThan(2000);
    expect(await pending).toBeInstanceOf(Error);
  });

  test("onClose rejects anything that is not a function", () => {
    expect(() => kaelum(quiet).onClose("x" as never)).toThrow(/expected a function/);
  });
});

describe("shutdown signals", () => {
  test("SIGTERM closes the app and exits 0; handlers are removed on close", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const before = process.listenerCount("SIGTERM");
    const closed: string[] = [];

    const app = kaelum({ health: false, observability: { logger: () => {} } });
    app.onClose(() => void closed.push("hook"));
    await app.start(0);
    expect(process.listenerCount("SIGTERM")).toBe(before + 1);

    process.emit("SIGTERM");
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));

    expect(closed).toEqual(["hook"]);
    expect(process.listenerCount("SIGTERM")).toBe(before);
    exit.mockRestore();
  });

  test("shutdown: false installs no signal handlers", async () => {
    const before = process.listenerCount("SIGINT");
    const app = kaelum(quiet);
    await app.start(0);

    expect(process.listenerCount("SIGINT")).toBe(before);
    await app.close();
  });
});

describe("logging", () => {
  test("c.log writes to the sink with the request ID", async () => {
    const entries: LogEntry[] = [];
    const app = kaelum({ ...quiet, observability: { logger: (entry) => entries.push(entry) } });
    app.route("/", {
      get: (c) => {
        c.log.info("hello", { user: 1 });
        c.log.warn("careful");
        return "ok";
      },
    });

    await request(app.express).get("/").set("X-Request-Id", "req-1");

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ level: "info", message: "hello", requestId: "req-1", data: { user: 1 } });
    expect(entries[0]?.time).toBeInstanceOf(Date);
    expect(entries[1]).toMatchObject({ level: "warn", message: "careful", requestId: "req-1" });
    expect(entries[1]).not.toHaveProperty("data");
  });

  test("app.log has no request ID", () => {
    const entries: LogEntry[] = [];
    const app = kaelum({ ...quiet, observability: { logger: (entry) => entries.push(entry) } });

    app.log.debug("booting");

    expect(entries[0]).toMatchObject({ level: "debug", message: "booting" });
    expect(entries[0]).not.toHaveProperty("requestId");
  });

  test("unhandled errors go to the sink, with the request ID and the error", async () => {
    const entries: LogEntry[] = [];
    const app = kaelum({ ...quiet, observability: { logger: (entry) => entries.push(entry) } });
    app.route("/boom", {
      get: () => {
        throw new Error("kaput");
      },
    });

    const res = await request(app.express).get("/boom").set("X-Request-Id", "req-9");

    expect(res.status).toBe(500);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      level: "error",
      message: "Unhandled error in GET /boom",
      requestId: "req-9",
    });
    expect((entries[0]?.data?.err as Error).message).toBe("kaput");
  });
});
