---
title: "IP Restriction"
description: Allow or deny requests by IP address or CIDR range with zero external dependencies.
sidebar:
  order: 9
---

Kaelum's IP restriction middleware lets you control access to your application by IP address or CIDR range. It is built entirely with Node's native `net` module and bitwise arithmetic — no external dependencies.

## Basic usage

```js
const app = require("kaelum")();

// Allow only requests from the local network; deny everything else
app.ipRestriction({
  allow: ["127.0.0.1", "192.168.1.0/24"],
  deny: ["0.0.0.0/0"],
});

app.get("/admin", (req, res) => res.json({ ok: true }));
app.start(3000);
```

## Allow/deny logic

| Condition | Result |
|-----------|--------|
| IP is in `allow` list | Always allowed (takes priority over `deny`) |
| IP is in `deny` list | Denied with `403 Forbidden` |
| IP matches neither | Allowed |

Using `"0.0.0.0/0"` in `deny` effectively blocks everyone except those in `allow`.

## CIDR notation

IPv4 CIDR ranges are fully supported:

```js
app.ipRestriction({
  allow: [
    "127.0.0.1",        // exact IP
    "10.0.0.0/8",       // entire 10.x.x.x range
    "192.168.1.0/24",   // 192.168.1.x subnet
  ],
  deny: ["0.0.0.0/0"],  // block all others
});
```

## Custom denial handler

```js
app.ipRestriction({
  deny: ["0.0.0.0/0"],
  onDenied: (req, res) => {
    res.status(403).json({
      error: "Access denied",
      ip: req.ip,
    });
  },
});
```

## Via setConfig

```js
app.setConfig({
  ipRestriction: {
    allow: ["192.168.1.0/24"],
    deny: ["0.0.0.0/0"],
  },
});
```

## Trust proxy

If your app runs behind a reverse proxy (Nginx, Cloudflare, etc.), enable trust proxy so `req.ip` reflects the real client IP:

```js
app.set("trust proxy", true);
app.ipRestriction({ ... });
```

> **Note:** IPv6-mapped IPv4 addresses (e.g. `::ffff:127.0.0.1`) are normalised automatically before matching.
