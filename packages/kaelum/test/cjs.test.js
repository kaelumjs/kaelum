const kaelum = require('../index.js');

describe('CommonJS Verification', () => {
  test('should successfully require the app factory', () => {
    expect(typeof kaelum).toBe('function');
  });

  test('should create an app instance with expected methods', () => {
    const app = kaelum();
    expect(app).toBeDefined();
    expect(typeof app.setConfig).toBe('function');
    expect(typeof app.addRoute).toBe('function');
  });
});
