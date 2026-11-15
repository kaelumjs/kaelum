const createApp = require('../createApp');
const request = require('supertest');

describe('createApp Factory', () => {
  test('should return an express app instance', () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof app.listen).toBe('function');
  });

  test('should have Kaelum helpers attached', () => {
    const app = createApp();
    expect(typeof app.start).toBe('function');
    expect(typeof app.addRoute).toBe('function');
    expect(typeof app.apiRoute).toBe('function');
    expect(typeof app.setConfig).toBe('function');
    expect(typeof app.close).toBe('function');
    expect(typeof app.onShutdown).toBe('function');
  });

  test('should initialize shutdown state', () => {
    const app = createApp();
    expect(app.locals._kaelum_shutdown_hooks).toEqual([]);
    expect(app.locals._kaelum_shutdown_in_progress).toBe(false);
  });

  test('should initialize with default config', () => {
    const app = createApp();
    const config = app.get('kaelum:config');
    expect(config).toBeDefined();
  });

  test('should support setConfig updates', () => {
    const app = createApp();
    app.setConfig({ port: 9000 });
    expect(app.get('kaelum:config').port).toBe(9000);
  });
});
