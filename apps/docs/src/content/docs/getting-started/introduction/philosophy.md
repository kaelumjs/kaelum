---
title: Philosophy
description: The vision and design principles behind Kaelum.
sidebar:
  order: 2
---

## The Name

**Kaelum** is a modern take on the Latin word **"Caelum,"** meaning "sky" or "heavens." It represents a vast and open horizon — a flexible foundation for your projects.

## Design Principles

### Minimal API Surface
Kaelum exposes only what you need: `setConfig`, `addRoute`, `apiRoute`, `start`, and a few helpers. If you can learn 7 functions, you know Kaelum.

### Convention Over Configuration
Scaffolded projects follow an MVC-ish structure. Beginners get a working project; advanced users reorganize freely.

### Nothing Hidden
Kaelum adds to Express — it never replaces it. The underlying Express app is always accessible. Mix Kaelum helpers with raw Express middleware.

### Zero Runtime Overhead
Kaelum is a configuration layer at startup. Once running, it's pure Express — no proxy objects, no runtime cost.

### Batteries Optional
CORS, Helmet, Morgan — toggle them with a flag, but nothing is forced. Each feature is opt-in.

## Express vs Kaelum

| Without Kaelum | With Kaelum |
|---|---|
| 15+ lines of middleware setup | `setConfig({ cors: true, helmet: true })` |
| Manual route registration per method | `apiRoute("users", { ... })` tree syntax |
| No project scaffolding | `npx kaelum create` |
| Manual `.env` loading | Automatic dotenv |
| DIY health checks | `app.healthCheck()` |
