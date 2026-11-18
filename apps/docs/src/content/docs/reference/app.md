---
title: App
description: kaelum(), the Kaelum class and every method of the app.
sidebar:
  order: 1
---

## `kaelum(options?)`

Creates an app. Also the default export.

```ts
import kaelum from "kaelum";
// or: import { kaelum } from "kaelum";
// or: const { kaelum } = require("kaelum");

const app = kaelum(options);
```

`options` is described in [Configuration](/guide/configuration/). Returns a `Kaelum` instance; `new Kaelum(options)` is equivalent.

## Routes

| Method | |
| --- | --- |
| `app.route(path, tree)` | register a route tree. See [Routing](/guide/routing/) |
| `app.route(defined)` | register a tree made with `defineRoutes` |
| `app.resource(path, actions)` | CRUD routes by convention: `list`, `create`, `get`, `update`, `replace`, `remove`, `use` |
| `app.get(path, endpoint)` | one `GET` route. Also `post`, `put`, `patch`, `delete` |
| `app.routes()` | every registered endpoint: `{ method, path }[]` |

All return the app, so calls can be chained. Registering a method and path twice throws.

### `defineRoutes(path)(tree)`

Declares a route tree away from the app, with `c.params` typed from `path`:

```ts
export const userRoutes = defineRoutes("/users/:id")({ get: (c) => c.params.id });
app.route(userRoutes);
```

## Middleware

| Method | |
| --- | --- |
| `app.use(...middleware)` | Express middleware for every request |
| `app.use(path, ...middleware)` | for requests under `path` |

## Lifecycle

| Member | |
| --- | --- |
| `app.start(port?)` | listen; resolves with the `http.Server`. Default port: `PORT`, then 3000 |
| `app.close()` | stop listening, wait for open requests, run `onClose` hooks |
| `app.onClose(hook)` | run `hook` when the app closes. May be async |
| `app.plugin(plugin, options?)` | run a plugin: `(app, options) => void` |
| `app.log` | the app's logger: `debug`, `info`, `warn`, `error` |

See [Lifecycle and plugins](/guide/lifecycle/).

## Express

| Member | |
| --- | --- |
| `app.express` | the underlying Express app |
| `app.handler` | a `(req, res)` function, to mount the app elsewhere |

See [Using with Express](/guide/express/).

## Types

| Type | |
| --- | --- |
| `KaelumOptions` | the options of `kaelum()` |
| `RouteTree<T, P>` | a route tree at path `P` |
| `ResourceActions<T, P>` | the actions of `app.resource` |
| `EndpointObject` | an endpoint written as an object |
| `Handler<P>` | `(c: Context<P>) => unknown` |
| `Middleware` | Express `RequestHandler` |
| `ParamsOf<P>` | the params of a path: `ParamsOf<"/a/:id">` is `{ id: string }` |
| `Plugin<Options>` | a plugin function |
| `RouteInfo` | an item of `app.routes()` |
