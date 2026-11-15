const createApp = require("../../createApp");
const request = require("supertest");

describe("Plugin System", () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  // --- Basic registration ---

  test("app.plugin should be a function", () => {
    expect(typeof app.plugin).toBe("function");
  });

  test("app.getPlugins should be a function", () => {
    expect(typeof app.getPlugins).toBe("function");
  });

  test("should register a named plugin and call it", () => {
    const spy = jest.fn();
    function myPlugin(app, opts) {
      spy(opts);
    }
    app.plugin(myPlugin, { greeting: "hello" });
    expect(spy).toHaveBeenCalledWith({ greeting: "hello" });
    expect(app.getPlugins()).toEqual(["myPlugin"]);
  });

  test("should register an anonymous plugin", () => {
    const spy = jest.fn();
    app.plugin((a, o) => spy(), {});
    expect(spy).toHaveBeenCalled();
    expect(app.getPlugins()).toEqual(["anonymous_0"]);
  });

  test("should support pluginName property", () => {
    const fn = (app) => {};
    fn.pluginName = "customName";
    app.plugin(fn);
    expect(app.getPlugins()).toEqual(["customName"]);
  });

  // --- Chaining ---

  test("should return app for chaining", () => {
    const result = app.plugin((a) => {});
    expect(result).toBe(app);
  });

  test("should chain multiple plugins", () => {
    function pluginA(app) {}
    function pluginB(app) {}
    app.plugin(pluginA).plugin(pluginB);
    expect(app.getPlugins()).toEqual(["pluginA", "pluginB"]);
  });

  // --- Validation ---

  test("should throw if argument is not a function", () => {
    expect(() => app.plugin("not a function")).toThrow(
      "expected a function"
    );
    expect(() => app.plugin(42)).toThrow("expected a function");
    expect(() => app.plugin(null)).toThrow("expected a function");
    expect(() => app.plugin(undefined)).toThrow("expected a function");
  });

  // --- Duplicate guard ---

  test("should throw on duplicate named plugins", () => {
    function myPlugin(app) {}
    app.plugin(myPlugin);
    expect(() => app.plugin(myPlugin)).toThrow("already registered");
  });

  test("should allow duplicate anonymous plugins", () => {
    const fn1 = (app) => {};
    const fn2 = (app) => {};
    // Both are anonymous arrow functions — no .name clash
    app.plugin(fn1);
    app.plugin(fn2);
    expect(app.getPlugins()).toEqual(["fn1", "fn2"]);
  });

  // --- Plugin capabilities ---

  test("plugin can add routes via addRoute", async () => {
    function routePlugin(app) {
      app.addRoute("/plugin-test", {
        get: (req, res) => res.json({ from: "plugin" }),
      });
    }
    app.plugin(routePlugin);

    const res = await request(app).get("/plugin-test");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ from: "plugin" });
  });

  test("plugin can add middleware via app.use", async () => {
    function headerPlugin(app) {
      app.use((req, res, next) => {
        res.setHeader("X-Plugin", "active");
        next();
      });
    }
    app.plugin(headerPlugin);
    app.addRoute("/mw-test", {
      get: (req, res) => res.send("ok"),
    });

    const res = await request(app).get("/mw-test");
    expect(res.headers["x-plugin"]).toBe("active");
  });

  test("plugin can call setConfig", () => {
    function configPlugin(app) {
      app.setConfig({ port: 8080 });
    }
    app.plugin(configPlugin);
    expect(app.getKaelumConfig().port).toBe(8080);
  });

  test("plugin receives options object", () => {
    let received;
    function optPlugin(app, opts) {
      received = opts;
    }
    app.plugin(optPlugin, { prefix: "/api", version: 2 });
    expect(received).toEqual({ prefix: "/api", version: 2 });
  });

  // --- getPlugins introspection ---

  test("getPlugins returns empty array before any registration", () => {
    expect(app.getPlugins()).toEqual([]);
  });

  test("getPlugins returns all registered names in order", () => {
    function alpha(app) {}
    function beta(app) {}
    function gamma(app) {}
    app.plugin(alpha).plugin(beta).plugin(gamma);
    expect(app.getPlugins()).toEqual(["alpha", "beta", "gamma"]);
  });
});
