import { fileURLToPath } from "node:url";
import kaelum, { serveStatic } from "kaelum";
import { pageRoutes } from "./routes/pages.ts";

/** Build the app without starting it, so tests can use it too. */
export function createApp() {
  const app = kaelum();

  app.use(serveStatic(fileURLToPath(new URL("../public", import.meta.url))));
  app.route(pageRoutes);

  return app;
}
