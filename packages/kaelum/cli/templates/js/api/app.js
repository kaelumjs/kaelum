const kaelum = require("kaelum");

const app = kaelum();

// Configure security and logging
app.setConfig({
  cors: true,
  helmet: true,
  logs: true,
  bodyParser: true,
});

// Observability: X-Request-Id + Server-Timing headers
app.requestId();
app.timing();

// Semantic response helpers: res.ok(), res.created(), res.notFound(), ...
app.useResponseHelpers();

// ETag + conditional requests (304 Not Modified)
app.useEtag();

// Mount routes
const routes = require("./routes");
routes(app);

// Health check endpoint
app.healthCheck("/health");

// Graceful shutdown hook
app.onShutdown(() => {
  console.log("Cleaning up resources...");
});

// 405 for known paths with the wrong method, then 404 for everything else
app.useMethodNotAllowed();
app.notFound();

// Error handler (JSON responses)
app.useErrorHandler({ exposeStack: false });

// Start server
const PORT = process.env.PORT || 4000;
app.start(PORT);
