---
title: "timing()"
description: Add Server-Timing header with request duration.
sidebar:
  order: 7
---

## Signature

```js
app.timing([options])
```

## Parameters

| Name | Type | Description |
|---|---|---|
| `options` | `Object` | Optional configuration object. |
| `options.headerName` | `string` | Custom header name (default: `'Server-Timing'`). |
| `options.precision` | `number` | Decimal places for duration in milliseconds (default: `2`). |

## Usage

This middleware tracks the total time taken to process a request and returns it in the response via the `Server-Timing` header, complying with the W3C specification. 

Modern browsers automatically parse this header and display backend execution times in their Network Developer Tools.

## Examples

```js
// Default usage
app.timing();

// With 4 decimal places of precision
app.timing({
  precision: 4
});
```

## Response Header

**Format:**
```http
Server-Timing: total;dur=12.34
```
