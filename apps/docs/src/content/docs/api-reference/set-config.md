---
title: "setConfig()"
description: Configure global application settings.
sidebar:
  order: 4
---

## Signature

```js
app.setConfig(options)
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | `3000` | Server port |
| `cors` | `boolean \| Object` | `false` | Enable CORS |
| `helmet` | `boolean \| Object` | `false` | Security headers |
| `logs` | `boolean \| string` | `false` | Morgan logging |
| `bodyParser` | `boolean` | `true` | JSON + urlencoded |
| `static` | `string \| boolean` | `false` | Static files path |
| `views` | `Object` | — | View engine config |
| `rateLimit` | `boolean \| Object` | `false` | Rate limiting |
| `gracefulShutdown` | `boolean \| Object` | `true` | Shutdown handling |

## Examples

```js
// Basic
app.setConfig({ port: 8080, logs: "dev", static: "public" });

// Security
app.setConfig({
  cors: { origin: "https://example.com" },
  helmet: true
});

// View engine
app.setConfig({
  views: { engine: "ejs", path: "./views" }
});

// Toggle features off
app.setConfig({ logs: false });

// Graceful shutdown with custom timeout
app.setConfig({
  gracefulShutdown: { timeout: 15000, signals: ["SIGTERM"] },
});
```

:::tip
`setConfig` merges with existing config. Call it before adding routes.
:::
