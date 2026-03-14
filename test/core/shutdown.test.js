const {
  onShutdown,
  close,
  enableGracefulShutdown,
  removeSignalHandlers,
} = require("../../core/shutdown");

describe("core/shutdown", () => {
  let app;

  beforeEach(() => {
    app = {
      locals: {
        _kaelum_shutdown_hooks: [],
        _kaelum_shutdown_in_progress: false,
        _kaelum_shutdown_handlers: null,
        _kaelum_shutdown_timeout: 10000,
        _kaelum_server: null,
      },
    };
  });

  afterEach(() => {
    // clean up any signal handlers that may have been registered
    removeSignalHandlers(app);
    jest.restoreAllMocks();
  });

  // =========================================================
  // onShutdown
  // =========================================================
  describe("onShutdown", () => {
    test("should register a cleanup hook", () => {
      const fn = jest.fn();
      onShutdown(app, fn);
      expect(app.locals._kaelum_shutdown_hooks).toContain(fn);
    });

    test("should allow multiple hooks", () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      onShutdown(app, fn1);
      onShutdown(app, fn2);
      expect(app.locals._kaelum_shutdown_hooks).toHaveLength(2);
    });

    test("should return app for chaining", () => {
      const result = onShutdown(app, jest.fn());
      expect(result).toBe(app);
    });

    test("should throw if fn is not a function", () => {
      expect(() => onShutdown(app, "not a fn")).toThrow(
        "onShutdown: expected a function"
      );
    });

    test("should throw if app is missing", () => {
      expect(() => onShutdown(null, jest.fn())).toThrow(
        "onShutdown requires an app instance"
      );
    });
  });

  // =========================================================
  // close — without server
  // =========================================================
  describe("close (no server)", () => {
    test("should resolve even if no server exists", async () => {
      await expect(close(app)).resolves.toBeUndefined();
    });

    test("should run cleanup hooks when no server exists", async () => {
      const fn = jest.fn();
      app.locals._kaelum_shutdown_hooks = [fn];
      await close(app);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("should support callback mode", (done) => {
      close(app, (err) => {
        expect(err).toBeNull();
        done();
      });
    });

    test("should return app in callback mode", () => {
      const result = close(app, jest.fn());
      expect(result).toBe(app);
    });
  });

  // =========================================================
  // close — with server
  // =========================================================
  describe("close (with server)", () => {
    let mockServer;

    beforeEach(() => {
      mockServer = {
        close: jest.fn((cb) => cb()),
        listening: true,
      };
      app.locals._kaelum_server = mockServer;
    });

    test("should call server.close()", async () => {
      await close(app);
      expect(mockServer.close).toHaveBeenCalledTimes(1);
    });

    test("should run cleanup hooks after server closes", async () => {
      const order = [];
      mockServer.close = jest.fn((cb) => {
        order.push("server");
        cb();
      });
      app.locals._kaelum_shutdown_hooks = [
        () => order.push("hook"),
      ];

      await close(app);
      expect(order).toEqual(["server", "hook"]);
    });

    test("should return a promise when no callback given", () => {
      const result = close(app);
      expect(result).toBeInstanceOf(Promise);
    });

    test("should call callback with null on success", (done) => {
      close(app, (err) => {
        expect(err).toBeNull();
        done();
      });
    });
  });

  // =========================================================
  // close — hook execution
  // =========================================================
  describe("close (hook execution)", () => {
    test("should run hooks in registration order", async () => {
      const order = [];
      app.locals._kaelum_shutdown_hooks = [
        () => order.push(1),
        () => order.push(2),
        () => order.push(3),
      ];
      await close(app);
      expect(order).toEqual([1, 2, 3]);
    });

    test("should run async hooks correctly", async () => {
      const result = [];
      app.locals._kaelum_shutdown_hooks = [
        async () => {
          await new Promise((r) => setTimeout(r, 10));
          result.push("async");
        },
      ];
      await close(app);
      expect(result).toEqual(["async"]);
    });

    test("should continue running hooks even if one throws", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const result = [];
      app.locals._kaelum_shutdown_hooks = [
        () => result.push("first"),
        () => {
          throw new Error("hook error");
        },
        () => result.push("third"),
      ];
      await close(app);
      expect(result).toEqual(["first", "third"]);
      consoleSpy.mockRestore();
    });
  });

  // =========================================================
  // close — timeout
  // =========================================================
  describe("close (timeout)", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("should resolve after timeout if server.close hangs", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const hangingServer = {
        close: jest.fn(), // never calls callback
        listening: true,
      };
      app.locals._kaelum_server = hangingServer;
      app.locals._kaelum_shutdown_timeout = 100;

      const promise = close(app);
      jest.advanceTimersByTime(100);
      await promise;

      expect(hangingServer.close).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test("should still run cleanup hooks after timeout", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const hangingServer = {
        close: jest.fn(),
        listening: true,
      };
      app.locals._kaelum_server = hangingServer;
      app.locals._kaelum_shutdown_timeout = 50;

      const hookFn = jest.fn();
      app.locals._kaelum_shutdown_hooks = [hookFn];

      const promise = close(app);
      jest.advanceTimersByTime(50);
      await promise;

      expect(hookFn).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });
  });

  // =========================================================
  // close — double-call prevention
  // =========================================================
  describe("close (double-call prevention)", () => {
    test("should not run shutdown twice if called while in progress", async () => {
      const hookFn = jest.fn();
      app.locals._kaelum_shutdown_hooks = [hookFn];

      // simulate in-progress
      app.locals._kaelum_shutdown_in_progress = true;

      await close(app);
      expect(hookFn).not.toHaveBeenCalled();
    });

    test("should resolve immediately on second call (promise mode)", async () => {
      app.locals._kaelum_shutdown_in_progress = true;
      await expect(close(app)).resolves.toBeUndefined();
    });

    test("should call callback immediately on second call (callback mode)", (done) => {
      app.locals._kaelum_shutdown_in_progress = true;
      const result = close(app, () => done());
      expect(result).toBe(app);
    });
  });

  // =========================================================
  // enableGracefulShutdown
  // =========================================================
  describe("enableGracefulShutdown", () => {
    test("should register handlers for SIGTERM and SIGINT by default", () => {
      const onSpy = jest.spyOn(process, "on");
      enableGracefulShutdown(app);

      const calls = onSpy.mock.calls.filter(
        ([sig]) => sig === "SIGTERM" || sig === "SIGINT"
      );
      expect(calls).toHaveLength(2);
    });

    test("should store handler references", () => {
      enableGracefulShutdown(app);
      const handlers = app.locals._kaelum_shutdown_handlers;
      expect(handlers).toBeTruthy();
      expect(typeof handlers.SIGTERM).toBe("function");
      expect(typeof handlers.SIGINT).toBe("function");
    });

    test("should set timeout in app.locals", () => {
      enableGracefulShutdown(app, { timeout: 5000 });
      expect(app.locals._kaelum_shutdown_timeout).toBe(5000);
    });

    test("should accept custom signals array", () => {
      const onSpy = jest.spyOn(process, "on");
      enableGracefulShutdown(app, { signals: ["SIGTERM"] });

      const calls = onSpy.mock.calls.filter(([sig]) => sig === "SIGTERM");
      expect(calls).toHaveLength(1);
      expect(app.locals._kaelum_shutdown_handlers.SIGINT).toBeUndefined();
    });

    test("should remove previous handlers before registering new ones", () => {
      const removeSpy = jest.spyOn(process, "removeListener");
      enableGracefulShutdown(app);
      enableGracefulShutdown(app);

      // second call should have removed the first set
      const removeCalls = removeSpy.mock.calls.filter(
        ([sig]) => sig === "SIGTERM" || sig === "SIGINT"
      );
      expect(removeCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================
  // removeSignalHandlers
  // =========================================================
  describe("removeSignalHandlers", () => {
    test("should remove registered signal handlers", () => {
      const removeSpy = jest.spyOn(process, "removeListener");
      enableGracefulShutdown(app);
      removeSignalHandlers(app);

      const removeCalls = removeSpy.mock.calls.filter(
        ([sig]) => sig === "SIGTERM" || sig === "SIGINT"
      );
      expect(removeCalls).toHaveLength(2);
    });

    test("should handle case where no handlers were registered", () => {
      expect(() => removeSignalHandlers(app)).not.toThrow();
    });

    test("should set _kaelum_shutdown_handlers to null", () => {
      enableGracefulShutdown(app);
      removeSignalHandlers(app);
      expect(app.locals._kaelum_shutdown_handlers).toBeNull();
    });
  });
});
