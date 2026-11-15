const express = require('express');
const request = require('supertest');
const addRoute = require('../../core/addRoute');

describe('core/addRoute', () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  test('should register a simple GET route via function', async () => {
    addRoute(app, '/test', (req, res) => res.status(200).send('OK'));
    
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  test('should register object-defined routes (get/post)', async () => {
    addRoute(app, '/resource', {
      get: (req, res) => res.send('GET'),
      post: (req, res) => res.send('POST')
    });

    const resGet = await request(app).get('/resource');
    expect(resGet.text).toBe('GET');

    const resPost = await request(app).post('/resource');
    expect(resPost.text).toBe('POST');
  });

  test('should support middleware array', async () => {
    const mw = (req, res, next) => {
      req.mw = true;
      next();
    };

    addRoute(app, '/mw', {
        get: [mw, (req, res) => res.send(`MW: ${req.mw}`)]
    });

    const res = await request(app).get('/mw');
    expect(res.text).toBe('MW: true');
  });
});
