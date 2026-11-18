import kaelum from "kaelum";
import { userRoutes } from "./routes/users.ts";

/**
 * Build the app without starting it, so tests can use it too.
 * Kaelum starts with security headers, request IDs, logs, a body size limit,
 * GET /health and graceful shutdown already on.
 */
export function createApp() {
  const app = kaelum({
    security: { cors: true },
  });

  app.route(userRoutes);

  app.get("/meta", () => ({ framework: "Kaelum" }));

  return app;
}
