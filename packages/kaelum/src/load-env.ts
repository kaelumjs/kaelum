// Imported first by the package entry point, so `.env` is loaded before any
// other module of the app runs: `import kaelum from "kaelum"` is enough.
// Set KAELUM_ENV_FILES=false to skip it.
import { loadEnvFiles } from "./env.js";

if (process.env.KAELUM_ENV_FILES !== "false") loadEnvFiles();
