---
title: "onShutdown() & close()"
description: Register cleanup hooks and trigger graceful shutdown.
sidebar:
  order: 8
---

## onShutdown()

### Signature

```js
app.onShutdown(fn)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `fn` | `Function` | Cleanup function (sync or async). |

**Returns:** `app` (for chaining).

### Example

```js
app.onShutdown(async () => {
  await db.disconnect();
  console.log("Database closed");
});

// Chaining
app
  .onShutdown(() => db.disconnect())
  .onShutdown(() => cache.close())
  .start(3000);
```

Hooks run **sequentially** in registration order. If one throws, remaining hooks still execute.

---

## close()

### Signature

```js
// Promise API
await app.close();

// Callback API
app.close(callback);
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `callback` | `Function` | Optional. Called with `(err)` when shutdown completes. |

**Returns:**
- Without callback: `Promise<void>`
- With callback: `app`

### Behavior

1. Stops the server from accepting new connections
2. Drains existing requests (up to configured timeout)
3. Runs all registered `onShutdown` hooks
4. Resolves / calls callback

Safe to call multiple times — second call resolves immediately (idempotent).

### Example

```js
// Programmatic shutdown in tests
afterAll(async () => {
  await app.close();
});

// Callback style
app.close((err) => {
  if (err) console.error("Shutdown error:", err);
  process.exit(err ? 1 : 0);
});
```
