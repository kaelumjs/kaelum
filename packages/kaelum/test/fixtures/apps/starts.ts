// An app file written the way the templates write it: build the app, start it.
import { kaelum } from "../../../src/index.js";

const app = kaelum({ shutdown: false, port: 1 });
app.get("/hello", () => ({ from: "starts.ts" }));

export const server = await app.start();
