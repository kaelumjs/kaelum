const kaelum = require("kaelum");

const app = kaelum();

// Configure security, static files, and body parsing
app.setConfig({
  cors: true,
  helmet: true,
  static: "public",
  bodyParser: true,
});

// Register routes
const routes = require("./routes");
routes(app);

// Health check endpoint
app.healthCheck("/health");

// Graceful shutdown hook
app.onShutdown(() => {
  console.log("Cleaning up resources...");
});

// Error handler (returns JSON on errors)
app.useErrorHandler({ exposeStack: false });

// Start server
const PORT = process.env.PORT || 3000;
app.start(PORT);
