---
title: Environment & Config
description: Configure your Kaelum app with setConfig and .env files.
sidebar:
  order: 1
---

## Environment Variables

Kaelum automatically loads variables from a `.env` file in your project root using `dotenv`. No need to manually `require('dotenv').config()`.

```bash
# .env
PORT=4000
DB_URL=mongodb://localhost/mydb
API_KEY=your-secret-key
```

Access them via `process.env`:

```js
const port = process.env.PORT || 3000;
app.start(port);
```

## setConfig()

Centralized configuration for your application:

```js
app.setConfig({
  port: 8080,            // default port
  cors: true,            // enable CORS
  helmet: true,          // security headers
  logs: "dev",           // morgan logging
  bodyParser: true,      // JSON + urlencoded
  static: "public",      // static files directory
  views: {               // view engine
    engine: "ejs",
    path: "./views"
  }
});
```

### Options Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | `3000` | Port for `app.start()` |
| `cors` | `boolean \| Object` | `false` | Enable CORS |
| `helmet` | `boolean \| Object` | `false` | Enable Helmet headers |
| `logs` | `boolean \| string` | `false` | Enable morgan logging |
| `bodyParser` | `boolean` | `true` | JSON + URL-encoded parsing |
| `static` | `string \| boolean` | `false` | Static files directory |
| `views` | `Object` | — | View engine (`{ engine, path }`) |
| `rateLimit` | `boolean \| Object` | `false` | Rate limiting |
| `gracefulShutdown` | `boolean \| Object` | `true` | Shutdown handling |

:::tip
Call `setConfig()` **before** adding routes. It merges with existing config, so you can call it multiple times.
:::
