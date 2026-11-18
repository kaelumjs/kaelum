// Minimal request logger: one line per response, written when it finishes.
//
//   GET /users 200 1.997 ms - 76

import type { NextFunction, Request, Response } from "express";

export type RequestLogFormat = "dev" | "tiny";

const RESET = "\x1b[0m";

function statusColor(status: number): string {
  if (status >= 500) return "\x1b[31m"; // red
  if (status >= 400) return "\x1b[33m"; // yellow
  if (status >= 300) return "\x1b[36m"; // cyan
  return "\x1b[32m"; // green
}

/** Build the log line for a finished response. Exported for tests. */
export function formatRequestLine(
  format: RequestLogFormat,
  info: { method: string; url: string; status: number; durationMs: number; length?: string }
): string {
  const status =
    format === "dev" ? `${statusColor(info.status)}${info.status}${RESET}` : String(info.status);
  return `${info.method} ${info.url} ${status} ${info.durationMs.toFixed(3)} ms - ${info.length ?? "-"}`;
}

/**
 * Create the request logging middleware.
 *
 * @param format "dev" colors the status code; "tiny" is the same line without colors
 * @param write  where lines go; defaults to stdout
 */
export function createRequestLogger(
  format: RequestLogFormat = "dev",
  write: (line: string) => void = (line) => process.stdout.write(line + "\n")
) {
  return function kaelumRequestLogger(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
      const length = res.getHeader("content-length");
      write(
        formatRequestLine(format, {
          method: req.method,
          url: req.originalUrl || req.url,
          status: res.statusCode,
          durationMs: Number(process.hrtime.bigint() - start) / 1_000_000,
          length: length === undefined ? undefined : String(length),
        })
      );
    });

    next();
  };
}
