const express = require('express');
const request = require('supertest');
const apiRoute = require('../../core/apiRoute');

describe('core/apiRoute', () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  test('should register REST paths correctly', async () => {
    apiRoute(app, 'users', {
      get: (req, res) => res.send('list'),
      "/:id": {
         get: (req, res) => res.send(`get ${req.params.id}`)
      }
    });

    const resList = await request(app).get('/users');
    expect(resList.text).toBe('list');

    const resItem = await request(app).get('/users/123');
    expect(resItem.text).toBe('get 123');
  });

  test('should support shorthand handlers (crud: true)', async () => {
    // Should create stub handlers that return 501
    apiRoute(app, 'items', true);

    const res = await request(app).get('/items');
    expect(res.status).toBe(501);
    expect(res.body.error).toBe('Not Implemented');
  });
});
