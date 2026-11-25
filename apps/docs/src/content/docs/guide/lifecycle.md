---
title: Lifecycle and plugins
description: Starting and stopping the app, graceful shutdown, onClose hooks and plugins.
sidebar:
  order: 12
---

## Starting

```ts
const server = await app.start(3000);
```

`start()` resolves once the server is listening, with the Node `http.Server`. Without a port it uses `process.env.PORT`, then `3000`.

## Graceful shutdown

When the process receives `SIGTERM` or `SIGINT` (what Docker, Kubernetes and Ctrl+C send), Kaelum:

1. stops accepting new connections;
2. lets open requests finish, for up to 10 seconds;
3. closes the connections still open after that;
4. runs the `onClose` hooks, in the order they were added;
5. exits.

Clean up your own resources in `onClose`:

```ts
app.onClose(() => db.close());
app.onClose(async () => {
  await queue.flush();
});
```

A hook that fails is logged and does not stop the others. Adjust or turn off the behavior with the [`shutdown` option](/guide/configuration/#shutdown).

`app.close()` runs the same steps without exiting the process, which is useful in scripts and tests. Calling it twice is safe.

## Plugins

A plugin is a function that receives the app and sets something up on it: routes, middleware, `onClose` hooks.

```ts
import type { Plugin } from "kaelum";

export const metrics: Plugin<{ path: string }> = (app, { path }) => {
  const started = Date.now();
  app.route(path, { get: () => ({ uptime: Date.now() - started }) });
};
```

```ts
app.plugin(metrics, { path: "/metrics" });
```

The second type parameter of `Plugin` types the options. When a plugin's options are optional, `app.plugin(plugin)` works without them.

Plugins run immediately, in the order they are added. There is no registry: a plugin can be added twice with different options, and a duplicate route still throws.
