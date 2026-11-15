import express from "express";
import request from "supertest";
import { createRequestLogger, formatRequestLine } from "../../src/core/requestLogger.js";
import createApp from "../../src/createApp.js";

describe("core/requestLogger", () => {
  const info = { method: "GET", url: "/users", status: 200, durationMs: 1.9966, length: "76" };

  test("tiny format has no colors", () => {
    expect(formatRequestLine("tiny", info)).toBe("GET /users 200 1.997 ms - 76");
  });

  test("dev format colors the status by class", () => {
    expect(formatRequestLine("dev", info)).toBe("GET /users \x1b[32m200\x1b[0m 1.997 ms - 76");
    expect(formatRequestLine("dev", { ...info, status: 404 })).toContain("\x1b[33m404");
    expect(formatRequestLine("dev", { ...info, status: 500 })).toContain("\x1b[31m500");
  });

  test("missing content-length is shown as a dash", () => {
    expect(formatRequestLine("tiny", { ...info, length: undefined })).toBe(
      "GET /users 200 1.997 ms - -"
    );
  });

  test("logs one line per finished response, with the original URL", async () => {
    const lines: string[] = [];
    const app = express();
    app.use(createRequestLogger("tiny", (line) => lines.push(line)));
    app.get("/users", (req, res) => res.json({ ok: true }));

    await request(app).get("/users?page=2");
    await request(app).get("/missing");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^GET \/users\?page=2 200 \d+\.\d{3} ms - 11$/);
    expect(lines[1]).toMatch(/^GET \/missing 404 /);
  });

  test("setConfig({ logs }) installs and removes the logger", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const app = createApp();

    app.setConfig({ logs: true });
    expect(app.locals._kaelum_logger).toBeTypeOf("function");

    app.setConfig({ logs: "combined" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown logs format "combined"'));
    expect(app.locals._kaelum_logger).toBeTypeOf("function");

    app.setConfig({ logs: false });
    expect(app.locals._kaelum_logger).toBeNull();

    log.mockRestore();
    warn.mockRestore();
  });
});
