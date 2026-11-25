---
title: Exports
description: Everything the kaelum package exports.
sidebar:
  order: 4
---

## `kaelum`

| Export | Kind | Docs |
| --- | --- | --- |
| `kaelum` (also the default export) | function | [App](/reference/app/) |
| `Kaelum` | class | [App](/reference/app/) |
| `Context` | class | [Context](/guide/context/) |
| `HttpError` | class | [Errors](/guide/errors/) |
| `k` | schema builder | [Validation](/guide/validation/#the-k-builder) |
| `rateLimit`, `ipRestriction`, `serveStatic` | middleware factories | [Middleware factories](/reference/middleware/) |

Types: `KaelumOptions`, `BodyOptions`, `CorsOptions`, `CsrfConfig`, `CsrfOptions`, `HealthOptions`, `RequestIdOptions`, `ShutdownOptions`, `TimingOptions`, `RateLimitOptions`, `RateLimitStore`, `IpRestrictionOptions`, `ServeStaticOptions`, `RouteTree`, `ResourceActions`, `SingleEndpoint`, `EndpointObject`, `StaticOptions`, `ViewsOptions`, `RedirectTarget`, `Handler`, `Middleware`, `Method`, `ParamsOf`, `RouteInfo`, `Plugin`, `CloseHook`, `ContextRequest`, `ContextResponse`, `Responded`, `ErrorBody`, `HttpErrorOptions`, `Logger`, `LogEntry`, `LogLevel`, `LogSink`, `Infer`, `KSchema`, `StandardSchemaV1`, `InferOutput`, `ValidationIssue`, `ValidationSource`.

## `kaelum/testing`

| Export | Docs |
| --- | --- |
| `testApp(app)` | [Testing](/guide/testing/) |

Types: `TestClient`, `TestResponse`, `TestRequestOptions`.
