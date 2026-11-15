---
title: "ipRestriction"
description: API reference for Kaelum's IP Restriction middleware.
sidebar:
  order: 11
---

## `app.ipRestriction(options)`

Installs IP-based access control middleware. Uses Node's native `net` module and bitwise CIDR arithmetic — no external dependencies.

### Parameters

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allow` | `string[]` | `[]` | CIDR or exact IPs that are always allowed (higher priority than `deny`). |
| `deny` | `string[]` | `[]` | CIDR or exact IPs that are denied. Use `'0.0.0.0/0'` to deny all by default. |
| `onDenied` | `(req, res) => void` | JSON 403 | Custom handler called when access is denied. |

### Returns

`KaelumApp` — the app instance (chainable).

### Allow/deny precedence

1. If the IP matches any rule in `allow` → **allow** (always wins).
2. If the IP matches any rule in `deny` → **deny** (calls `onDenied` or returns default 403).
3. Otherwise → **allow**.

### Example

```js
app.ipRestriction({
  allow: ["127.0.0.1", "10.0.0.0/8"],
  deny: ["0.0.0.0/0"],
  onDenied: (req, res) => res.status(403).json({ error: "Forbidden" }),
});
```

### Default 403 response

When `onDenied` is not provided:

```json
{
  "error": "Forbidden",
  "message": "Your IP address is not allowed to access this resource."
}
```

---

## `setConfig({ ipRestriction })`

```js
app.setConfig({
  ipRestriction: {
    allow: ["192.168.1.0/24"],
    deny: ["0.0.0.0/0"],
  },
});
```

Set to `false` to disable the Kaelum-managed IP restriction middleware.
