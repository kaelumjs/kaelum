const express = require('express');
const setConfig = require('../../core/setConfig');
const path = require('path');

describe('core/setConfig', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.locals = {};
    app.set = jest.fn(); // mock app.set
    // Mock for app.use to track middleware registration
    app.use = jest.fn();
    // Partially mock _router for removal logic
    app._router = { stack: [] };
  });

  test('should persist config to app.locals', () => {
    const opts = { port: 5000 };
    const res = setConfig(app, opts);
    expect(res.port).toBe(5000);
    expect(app.locals.kaelumConfig.port).toBe(5000);
    expect(app.set).toHaveBeenCalledWith('kaelum:config', expect.objectContaining({ port: 5000 }));
  });

  test('should configure views engine and path', () => {
    const opts = {
      views: {
        engine: 'ejs',
        path: './my-views'
      }
    };
    setConfig(app, opts);
    expect(app.set).toHaveBeenCalledWith('view engine', 'ejs');
    
    // Check if views path is resolved (absolute)
    const expectedPath = path.resolve(process.cwd(), './my-views');
    expect(app.set).toHaveBeenCalledWith('views', expectedPath);
  });

  test('should disable features when set to false', () => {
    // Stub functionality - just checking logic flow doesn't crash and persists config
    const opts = { logs: false, bodyParser: false };
    const res = setConfig(app, opts);
    expect(res.logs).toBe(false);
    expect(res.bodyParser).toBe(false);
  });
});
