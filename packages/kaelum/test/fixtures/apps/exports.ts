// An app file that exports the app and never starts it.
import { kaelum } from "../../../src/index.js";

const app = kaelum({ shutdown: false });
app.get("/hello", () => ({ from: "exports.ts" }));

export default app;
