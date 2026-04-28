import kaelum from "kaelum";
import { routes } from "./routes";

const app = kaelum();

// Configure security and logging
app.setConfig({
  cors: true,
  helmet: true,
  logs: true,
  bodyParser: true,
});

// Mount routes
routes(app);

// Health check endpoint
app.healthCheck("/health");

// Graceful shutdown hook
app.onShutdown(() => {
  console.log("Cleaning up resources...");
});

// Error handler (JSON responses)
app.useErrorHandler({ exposeStack: false });

// Start server
const PORT = process.env.PORT || 4000;
app.start(PORT);
