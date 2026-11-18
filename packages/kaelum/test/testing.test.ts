import { kaelum } from "../src/index.js";
import { defaultLogSink, type LogEntry } from "../src/logger.js";
import { testApp } from "../src/testing.js";

describe("kaelum/testing", () => {
  const app = kaelum({ shutdown: false });
  app.route("/echo", {
    get: (c) => ({ query: c.query, header: c.req.header("x-test") }),
    post: (c) => c.created({ got: c.body }),
    put: (c) => ({ got: c.body }),
    patch: (c) => ({ got: c.body }),
    delete: (c) => c.noContent(),
  });
  app.route("/text", { get: () => "plain", post: (c) => ({ type: c.req.header("content-type"), body: c.body }) });
  app.route("/go", { get: (c) => c.redirect("/echo") });

  const client = testApp(app);
  afterAll(() => client.close());

  test("GET with query and headers, JSON parsed", async () => {
    const res = await client.get("/echo", { query: { page: 2, q: "a b" }, headers: { "x-test": "1" } });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ query: { page: "2", q: "a b" }, header: "1" });
    expect(res.headers.get("content-type")).toMatch(/json/);
  });

  test("bodies are sent as JSON", async () => {
    expect(await client.post("/echo", { a: 1 })).toMatchObject({ status: 201, body: { got: { a: 1 } } });
    expect((await client.put("/echo", { b: 2 })).body).toEqual({ got: { b: 2 } });
    expect((await client.patch("/echo", { c: 3 })).body).toEqual({ got: { c: 3 } });
  });

  test("string bodies are sent as is, with the given content type", async () => {
    const res = await client.post("/text", "a=1", { headers: { "content-type": "application/x-www-form-urlencoded" } });
    expect(res.body).toEqual({ type: "application/x-www-form-urlencoded", body: { a: "1" } });
  });

  test("text and empty responses", async () => {
    const text = await client.get("/text");
    expect(text.body).toBe("plain");
    expect(text.text).toBe("plain");

    const empty = await client.delete("/echo");
    expect(empty.status).toBe(204);
    expect(empty.body).toBeUndefined();
    expect(empty.text).toBe("");
  });

  test("redirects are not followed", async () => {
    const res = await client.get("/go");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/echo");
  });

  test("request() takes any method; errors keep the standard body", async () => {
    const res = await client.request("options", "/echo");
    expect(res.status).toBe(204);

    const missing = await client.get("/nope");
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");
  });

  test("close() stops the server, and the client reopens on the next request", async () => {
    const other = testApp(app);
    await other.close(); // never opened: nothing to do
    expect((await other.get("/health")).status).toBe(200);
    await other.close();
    expect((await other.get("/health")).status).toBe(200);
    await other.close();
  });
});

describe("default log sink", () => {
  const entry = (extra: Partial<LogEntry> = {}): LogEntry => ({
    level: "info",
    message: "hi",
    time: new Date("2026-01-02T03:04:05.000Z"),
    ...extra,
  });

  test("console output outside production", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const sink = defaultLogSink("development");

    sink(entry());
    sink(entry({ level: "error", data: { a: 1 } }));

    expect(info).toHaveBeenCalledWith("hi");
    expect(error).toHaveBeenCalledWith("hi", { a: 1 });
    info.mockRestore();
    error.mockRestore();
  });

  test("JSON lines in production, errors serialized, warnings and errors on stderr", () => {
    const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const sink = defaultLogSink("production");

    sink(entry({ requestId: "r1", data: { user: 7 } }));
    sink(entry({ level: "error", data: { err: new Error("boom") } }));

    const first = JSON.parse(String(out.mock.calls[0]?.[0]));
    const second = JSON.parse(String(err.mock.calls[0]?.[0]));
    out.mockRestore();
    err.mockRestore();

    expect(first).toEqual({ level: "info", time: "2026-01-02T03:04:05.000Z", requestId: "r1", message: "hi", user: 7 });
    expect(second.err).toMatchObject({ name: "Error", message: "boom" });
    expect(second.err.stack).toContain("boom");
  });
});
