const express = require("express");
const start = require("../../core/start");

describe("core/start", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.locals = {};
  });

  test("should start server on specified port", () => {
    const listenSpy = jest
      .spyOn(app, "listen")
      .mockImplementation((port, cb) => {
        expect(port).toBe(4567);
        const fakeServer = {
          on: jest.fn(),
          listening: true,
          address: () => ({ port }),
        };
        if (cb) cb();
        return fakeServer;
      });

    const server = start(app, 4567);
    expect(app.locals._kaelum_server).toBeTruthy();
    listenSpy.mockRestore();
  });

  test("should default to port 3000 when no port given", () => {
    const listenSpy = jest
      .spyOn(app, "listen")
      .mockImplementation((port, cb) => {
        expect(port).toBe(3000);
        const fakeServer = {
          on: jest.fn(),
          listening: true,
          address: () => ({ port }),
        };
        if (cb) cb();
        return fakeServer;
      });

    start(app);
    listenSpy.mockRestore();
  });

  test("should read port from kaelum config", () => {
    app.set("kaelum:config", { port: 4000 });

    const listenSpy = jest
      .spyOn(app, "listen")
      .mockImplementation((port, cb) => {
        expect(port).toBe(4000);
        const fakeServer = {
          on: jest.fn(),
          listening: true,
          address: () => ({ port }),
        };
        if (cb) cb();
        return fakeServer;
      });

    start(app);
    listenSpy.mockRestore();
  });

  test("should prefer explicit port over config", () => {
    app.set("kaelum:config", { port: 4000 });

    const listenSpy = jest
      .spyOn(app, "listen")
      .mockImplementation((port, cb) => {
        expect(port).toBe(5000);
        const fakeServer = {
          on: jest.fn(),
          listening: true,
          address: () => ({ port }),
        };
        if (cb) cb();
        return fakeServer;
      });

    start(app, 5000);
    listenSpy.mockRestore();
  });

  test("should return existing server if already listening", () => {
    const fakeServer = {
      on: jest.fn(),
      listening: true,
      address: () => ({ port: 3000 }),
    };
    app.locals._kaelum_server = fakeServer;

    const result = start(app, 3000);
    expect(result).toBe(fakeServer);
  });

  test("should store server in app.locals._kaelum_server", () => {
    const fakeServer = {
      on: jest.fn(),
      listening: false,
      address: () => ({ port: 8080 }),
    };
    const listenSpy = jest
      .spyOn(app, "listen")
      .mockImplementation((port, cb) => {
        fakeServer.listening = true;
        if (cb) cb();
        return fakeServer;
      });

    const server = start(app, 8080);
    expect(app.locals._kaelum_server).toBe(server);
    listenSpy.mockRestore();
  });

  test("should throw on missing app", () => {
    expect(() => start(null)).toThrow("start requires an app instance");
  });

  test("should throw on invalid port", () => {
    expect(() => start(app, "abc")).toThrow("Invalid port value");
  });

  test("should throw on out-of-range port", () => {
    expect(() => start(app, 99999)).toThrow("Port out of range");
  });
});
