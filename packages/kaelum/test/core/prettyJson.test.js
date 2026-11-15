const request = require("supertest");
const createApp = require("../../createApp");

describe("core/prettyJson", () => {
  describe("always mode (default)", () => {
    it("formats JSON with 2-space indent when usePrettyJson() is called", async () => {
      const app = createApp();
      app.usePrettyJson();
      app.get("/data", (req, res) => res.json({ hello: "world" }));

      const res = await request(app).get("/data");
      expect(res.status).toBe(200);
      // Body should be pretty-printed
      expect(res.text).toBe(JSON.stringify({ hello: "world" }, null, 2));
    });

    it("formats JSON via setConfig({ prettyJson: true })", async () => {
      const app = createApp();
      app.setConfig({ prettyJson: true });
      app.get("/ping", (req, res) => res.json({ ok: true }));

      const res = await request(app).get("/ping");
      expect(res.text).toBe(JSON.stringify({ ok: true }, null, 2));
    });

    it("applies pretty even without ?pretty querystring", async () => {
      const app = createApp();
      app.usePrettyJson();
      app.get("/obj", (req, res) => res.json({ a: 1, b: 2 }));

      const res = await request(app).get("/obj");
      expect(res.text).toContain("\n"); // newlines → pretty-printed
    });
  });

  describe("query mode", () => {
    it("only formats when ?pretty is in the URL", async () => {
      const app = createApp();
      app.usePrettyJson("query");
      app.get("/data", (req, res) => res.json({ value: 42 }));

      const prettyRes = await request(app).get("/data?pretty");
      const compactRes = await request(app).get("/data");

      expect(prettyRes.text).toBe(JSON.stringify({ value: 42 }, null, 2));
      // Without ?pretty, the response should not have extra whitespace
      expect(compactRes.text).not.toContain("\n");
    });

    it("supports setConfig({ prettyJson: 'query' })", async () => {
      const app = createApp();
      app.setConfig({ prettyJson: "query" });
      app.get("/q", (req, res) => res.json({ q: true }));

      const withPretty = await request(app).get("/q?pretty");
      expect(withPretty.text).toContain("\n");

      const withoutPretty = await request(app).get("/q");
      expect(withoutPretty.text).not.toContain("\n");
    });
  });
});
