const createApp = require('../createApp');
const request = require('supertest');

describe('Recursive Routing', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  test('should support deep nested routes via addRoute', async () => {
    app.addRoute('/api', {
        get: (req, res) => res.json({ level: 0 }),
        '/v1': {
            get: (req, res) => res.json({ level: 1 }),
            '/users': {
                get: (req, res) => res.json({ level: 2 }),
                '/:id': {
                    get: (req, res) => res.json({ id: req.params.id }),
                    '/posts': {
                        get: (req, res) => res.json({ posts: true, userId: req.params.id })
                    }
                }
            }
        }
    });

    const res0 = await request(app).get('/api');
    expect(res0.status).toBe(200);
    expect(res0.body).toEqual({ level: 0 });

    const res1 = await request(app).get('/api/v1');
    expect(res1.status).toBe(200);
    expect(res1.body).toEqual({ level: 1 });

    const res2 = await request(app).get('/api/v1/users');
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual({ level: 2 });

    const res3 = await request(app).get('/api/v1/users/123');
    expect(res3.status).toBe(200);
    expect(res3.body).toEqual({ id: '123' });

    const res4 = await request(app).get('/api/v1/users/123/posts');
    expect(res4.status).toBe(200);
    expect(res4.body).toEqual({ posts: true, userId: '123' });
  });

  test('should support mixed methods and nesting', async () => {
    app.addRoute('/mixed', {
        get: (req, res) => res.send('root'),
        post: (req, res) => res.send('posted'),
        '/child': {
            put: (req, res) => res.send('child put')
        }
    });

    await request(app).get('/mixed').expect(200, 'root');
    await request(app).post('/mixed').expect(200, 'posted');
    await request(app).put('/mixed/child').expect(200, 'child put');
  });
});
