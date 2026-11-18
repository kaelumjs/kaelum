import express from "express";
import type { Middleware } from "../routing/types.js";

export interface ServeStaticOptions {
  /** Cache-Control max-age, in ms or as a string such as `"1d"`. Default 0. */
  maxAge?: number | string;
  /** Add `immutable` to Cache-Control. Use with fingerprinted file names. Default false. */
  immutable?: boolean;
  /** File served for a directory. `false` disables it. Default `"index.html"`. */
  index?: string | string[] | false;
  /** Extensions tried when a file is not found, e.g. `["html"]`. Default none. */
  extensions?: string[] | false;
  /** How to treat dotfiles. Default `"ignore"`. */
  dotfiles?: "allow" | "deny" | "ignore";
  /** Pass to the next handler when a file is not found. Default true. */
  fallthrough?: boolean;
}

/**
 * Serve the files in a folder.
 *
 * @example
 * app.use(serveStatic("public"));
 * app.use("/assets", serveStatic("dist/assets", { maxAge: "1y", immutable: true }));
 */
export function serveStatic(root: string, options?: ServeStaticOptions): Middleware {
  return express.static(root, options);
}
