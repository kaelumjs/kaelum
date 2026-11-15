const express = require('express');
const request = require('supertest');
const { errorHandler } = require('../../core/errorHandler');

describe('core/errorHandler', () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  test('should return JSON error response', async () => {
    app.get('/error', (req, res, next) => {
      const err = new Error('Something went wrong');
      err.status = 400;
      next(err);
    });

    // Attach handler
    app.use(errorHandler({ exposeStack: false, logger: false }));

    const res = await request(app).get('/error');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Something went wrong');
    expect(res.body.stack).toBeUndefined();
  });

  test('should default to 500 for unknown errors', async () => {
    app.get('/crash', (req, res, next) => {
      next(new Error('Crash'));
    });
    app.use(errorHandler({ logger: false }));

    const res = await request(app).get('/crash');
    expect(res.status).toBe(500);
  });
});
