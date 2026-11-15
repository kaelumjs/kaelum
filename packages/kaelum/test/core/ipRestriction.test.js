const request = require("supertest");
const createApp = require("../../createApp");
const { matchesCIDR } = require("../../core/ipRestriction");

describe("core/ipRestriction", () => {
  describe("CIDR matching", () => {
    it("matches exact IP", () => {
      expect(matchesCIDR("192.168.1.5", "192.168.1.5")).toBe(true);
      expect(matchesCIDR("192.168.1.6", "192.168.1.5")).toBe(false);
    });

    it("matches /24 CIDR", () => {
      expect(matchesCIDR("192.168.1.100", "192.168.1.0/24")).toBe(true);
      expect(matchesCIDR("192.168.2.1", "192.168.1.0/24")).toBe(false);
    });

    it("matches /8 CIDR", () => {
      expect(matchesCIDR("10.0.0.1", "10.0.0.0/8")).toBe(true);
      expect(matchesCIDR("11.0.0.1", "10.0.0.0/8")).toBe(false);
    });

    it("matches 0.0.0.0/0 (wildcard — all IPs)", () => {
      expect(matchesCIDR("8.8.8.8", "0.0.0.0/0")).toBe(true);
      expect(matchesCIDR("127.0.0.1", "0.0.0.0/0")).toBe(true);
    });

    it("handles IPv6-mapped IPv4 (::ffff:127.0.0.1)", () => {
      expect(matchesCIDR("::ffff:127.0.0.1", "127.0.0.1")).toBe(true);
    });
  });

  describe("middleware behaviour", () => {
    it("allows IPs in the allow list even when deny catches all", async () => {
      const app = createApp();
      app.set("trust proxy", true);
      app.ipRestriction({
        allow: ["127.0.0.1"],
        deny: ["0.0.0.0/0"],
      });
      app.get("/secret", (req, res) => res.json({ ok: true }));

      const res = await request(app).get("/secret");
      // supertest connects from 127.0.0.1 (loopback)
      expect(res.status).toBe(200);
    });

    it("blocks IPs in the deny list", async () => {
      const app = createApp();
      app.set("trust proxy", false);
      app.ipRestriction({
        deny: ["0.0.0.0/0"],
      });
      app.get("/blocked", (req, res) => res.json({ ok: true }));

      // supertest connects from 127.0.0.1 which matches 0.0.0.0/0
      const res = await request(app).get("/blocked");
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden");
    });

    it("accepts a custom onDenied handler", async () => {
      const app = createApp();
      app.ipRestriction({
        deny: ["0.0.0.0/0"],
        onDenied: (req, res) => {
          res.status(403).json({ custom: "You shall not pass" });
        },
      });
      app.get("/guarded", (req, res) => res.json({ ok: true }));

      const res = await request(app).get("/guarded");
      expect(res.status).toBe(403);
      expect(res.body.custom).toBe("You shall not pass");
    });

    it("allows all traffic when no rules are configured", async () => {
      const app = createApp();
      app.ipRestriction({ allow: [], deny: [] });
      app.get("/open", (req, res) => res.json({ open: true }));

      const res = await request(app).get("/open");
      expect(res.status).toBe(200);
    });

    it("supports setConfig({ ipRestriction: {...} })", async () => {
      const app = createApp();
      app.setConfig({
        ipRestriction: {
          allow: ["127.0.0.1"],
          deny: ["0.0.0.0/0"],
        },
      });
      app.get("/cfg", (req, res) => res.json({ via: "config" }));

      const res = await request(app).get("/cfg");
      // localhost (127.0.0.1) is in allow list so should pass
      expect(res.status).toBe(200);
    });
  });
});
