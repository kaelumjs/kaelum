import { createApp } from "./app.js";

const app = createApp();
const port = Number(process.env.PORT ?? 3000);

await app.start(port);
app.log.info(`Listening on http://localhost:${port}`);
