// core/env.ts
// Loads environment variables from .env files using Node's built-in loader.

import path from "node:path";

/**
 * Load `.env.<NODE_ENV>` first, then `.env` as a fallback.
 *
 * Variables already present in `process.env` are never overwritten, so real
 * environment variables win over both files, and the env-specific file wins
 * over the base one. Missing files are ignored.
 *
 * @returns the files that were loaded, in order
 */
export function loadEnvFiles(cwd: string = process.cwd()): string[] {
  const nodeEnv = process.env.NODE_ENV || "development";
  const loaded: string[] = [];

  for (const name of [`.env.${nodeEnv}`, ".env"]) {
    const file = path.resolve(cwd, name);
    try {
      process.loadEnvFile(file);
      loaded.push(file);
    } catch (err) {
      // A missing file is expected; anything else (e.g. unreadable) is worth surfacing.
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`Kaelum: could not load ${name}: ${(err as Error).message}`);
      }
    }
  }

  return loaded;
}
