import path from "node:path";

/**
 * Load `.env.<NODE_ENV>` and then `.env` from `cwd` into `process.env`.
 *
 * Variables already set are never overwritten, so the real environment wins
 * over both files, and the environment-specific file wins over the base one.
 * Missing files are ignored.
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
      // A missing file is expected; anything else (unreadable, a folder) is worth a warning.
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`Kaelum: could not load ${name}: ${(err as Error).message}`);
      }
    }
  }

  return loaded;
}
