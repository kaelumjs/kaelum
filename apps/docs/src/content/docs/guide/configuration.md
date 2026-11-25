---
title: Configuration
description: Every option of kaelum(), with its default.
sidebar:
  order: 8
---

All configuration goes to `kaelum()`, once:

```ts
const app = kaelum({
  security: { cors: { origin: "https://app.example" } },
  observability: { logs: "tiny" },
  trustProxy: true,
});
```

With no options, Kaelum starts with production defaults. Each option turns a default off or adjusts it. Boolean-or-object options follow one rule: `true` turns the feature on with its defaults, `false` turns it off, an object turns it on and configures it.

## Defaults at a glance

| Feature | Default | Option |
| --- | --- | --- |
| Security headers (Helmet) | **on** | `security.helmet` |
| Body parsing, 100 kb limit | **on** | `body` |
| Request IDs | **on** | `observability.requestId` |
| Request logs | **on** (off when `NODE_ENV=test`) | `observability.logs` |
| `GET /health` | **on** | `health` |
| Graceful shutdown | **on** | `shutdown` |
| CORS | off | `security.cors` |
| Rate limit | off | `security.rateLimit` |
| CSRF | off | `security.csrf` |
| IP restriction | off | `security.ipRestriction` |
| Server-Timing | off | `observability.timing` |
| Trust proxy headers | off | `trustProxy` |
| `ETag` header (weak) | **on** | `etag` |
| Static files | off | `static` |
| Views | off | `views` |
| Pretty JSON | off | `json.pretty` |
| Trailing slash redirect | off | `trailingSlash` |
| Redirect map | none | `redirects` |
| Custom 404 / error responses | none | `notFound`, `onError` |

## Security

| Option | Type | Default |
| --- | --- | --- |
| `helmet` | `boolean \| HelmetOptions` | `true` |
| `cors` | `boolean \| CorsOptions` | `false` |
| `rateLimit` | `boolean \| RateLimitOptions` | `false` |
| `csrf` | `boolean \| CsrfConfig` | `false` |
| `ipRestriction` | `IpRestrictionOptions` | none |

Details and examples: [Security](/guide/security/).

## Observability

| Option | Type | Default |
| --- | --- | --- |
| `requestId` | `boolean \| { header?, generate? }` | `true`: header `X-Request-Id`, `crypto.randomUUID` |
| `logs` | `boolean \| "dev" \| "tiny"` | `"dev"` in development, `"tiny"` in production, off in test |
| `logger` | `(entry: LogEntry) => void` | JSON lines in production, console otherwise |
| `timing` | `boolean \| { headerName?, precision? }` | `false` |

Details: [Observability](/guide/observability/).

## Body

```ts
kaelum({ body: { limit: "1mb", urlencoded: false } });
kaelum({ body: false }); // no body parsing at all
```

| Option | Default |
| --- | --- |
| `limit` | `"100kb"`. Bytes or a string such as `"1mb"`. Larger bodies get `413` |
| `json` | `true`: parse `application/json` |
| `urlencoded` | `true`: parse HTML form posts |

## Query

`"simple"` (default) parses `?a=1&b=2` into flat string values. `"extended"` turns `?filter[tag]=x` into nested objects. Simple is the safer choice: nested query objects are a common source of injection bugs.

## Trust proxy

Behind a reverse proxy or load balancer, set `trustProxy` so `req.ip` and HTTPS detection use the `X-Forwarded-*` headers. Without it, every client appears with the proxy's address, which breaks rate limiting and IP restriction.

Accepts what Express's `trust proxy` setting accepts: `true`, a number of hops, or addresses.

## Health

```ts
kaelum({ health: "/healthz" });                         // another path
kaelum({ health: { check: () => db.ping() } });         // readiness check
kaelum({ health: false });                              // no health route
```

The route answers `{ "status": "ok" }`. With a `check`, a thrown error or a `false` result answers `503` without revealing why.

## Pages

| Option | Type | Default |
| --- | --- | --- |
| `static` | `string \| StaticOptions` | off |
| `views` | `boolean \| { engine?, dir? }` | off. `true`: EJS from `views/` |
| `trailingSlash` | `false \| "redirect"` | `false` |
| `redirects` | `Record<string, string \| { to, status? }>` | none |
| `notFound` | `(c) => unknown` | JSON 404 |

Details and examples: [Pages and views](/guide/pages/).

## Responses

| Option | Default |
| --- | --- |
| `etag` | `"weak"`: clients can revalidate and get a `304`. `"strong"` or `false` |
| `json.pretty` | `false`. `true` indents every JSON response; `"query"` only with `?pretty` in the URL |
| `onError` | none. See [Errors](/guide/errors/#custom-error-responses) |

## Environment variables

Importing `kaelum` loads `.env.<NODE_ENV>` and then `.env` from the project root into `process.env`, before the rest of the app runs:

```bash title=".env"
PORT=3000
DATABASE_URL=postgres://localhost/app
```

- Variables already set in the environment are never overwritten, so real environment variables (in production, in CI) win over both files, and `.env.production` wins over `.env`.
- Missing files are ignored.
- `KAELUM_ENV_FILES=false` turns it off, for example when another tool already loads the files.

For `.env` to be loaded before a module reads `process.env`, import `kaelum` first in the entry file, as the templates do.

## Port

`app.start()` listens on, in order: the port passed to it, `PORT` from the environment, the `port` option, then 3000.

## Shutdown

| Option | Default |
| --- | --- |
| `timeout` | `10000` ms to let open requests finish |
| `signals` | `["SIGTERM", "SIGINT"]` |

`shutdown: false` installs no signal handlers. See [Lifecycle](/guide/lifecycle/).
