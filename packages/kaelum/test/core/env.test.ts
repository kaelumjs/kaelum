import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnvFiles } from "../../src/core/env.js";

describe("core/env", () => {
  let dir: string;
  const keys = ["KAELUM_TEST_A", "KAELUM_TEST_B", "KAELUM_TEST_C"];
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "kaelum-env-"));
    for (const key of keys) delete process.env[key];
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    for (const key of keys) delete process.env[key];
    process.env.NODE_ENV = originalNodeEnv;
  });

  test("loads .env.<NODE_ENV> before .env, and the specific file wins", () => {
    process.env.NODE_ENV = "staging";
    fs.writeFileSync(path.join(dir, ".env.staging"), "KAELUM_TEST_A=from-staging\n");
    fs.writeFileSync(path.join(dir, ".env"), "KAELUM_TEST_A=from-base\nKAELUM_TEST_B=base-only\n");

    const loaded = loadEnvFiles(dir);

    expect(loaded.map((file) => path.basename(file))).toEqual([".env.staging", ".env"]);
    expect(process.env.KAELUM_TEST_A).toBe("from-staging");
    expect(process.env.KAELUM_TEST_B).toBe("base-only");
  });

  test("never overwrites variables that are already set", () => {
    process.env.KAELUM_TEST_C = "from-shell";
    fs.writeFileSync(path.join(dir, ".env"), "KAELUM_TEST_C=from-file\n");

    loadEnvFiles(dir);

    expect(process.env.KAELUM_TEST_C).toBe("from-shell");
  });

  test("ignores missing files", () => {
    expect(loadEnvFiles(dir)).toEqual([]);
  });
});
