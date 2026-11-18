// Server-Timing header with the time spent on each request (W3C Server-Timing).

import type { Response } from "express";
import type { Middleware } from "../routing/types.js";

export interface TimingOptions {
  /** Default `Server-Timing`. */
  headerName?: string;
  /** Decimal places of the duration in ms. Default 2. */
  precision?: number;
}

/**
 * Add `Server-Timing: total;dur=<ms>` to every response, measured from when
 * the request reached this middleware until the headers are written.
 */
export function serverTiming(options: TimingOptions = {}): Middleware {
  const headerName = options.headerName || "Server-Timing";
  const precision = options.precision ?? 2;

  return (_req, res, next) => {
    const start = process.hrtime.bigint();

    // The headers can only change before they are sent, so hook into writeHead.
    const writeHead = res.writeHead;
    res.writeHead = function (this: Response, ...args: unknown[]) {
      if (!res.getHeader(headerName)) {
        const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
        res.setHeader(headerName, `total;dur=${ms.toFixed(precision)}`);
      }
      return writeHead.apply(this, args as Parameters<typeof writeHead>);
    } as typeof writeHead;

    next();
  };
}
