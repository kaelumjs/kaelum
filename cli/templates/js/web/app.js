const kaelum = require("kaelum");

const app = kaelum();

// Configure security, static files, and body parsing
app.setConfig({
  cors: true,
  helmet: true,
  static: "public",
  bodyParser: true,
});

// Observability: X-Request-Id + Server-Timing headers
app.requestId();
app.timing();

// Redirect /about/ -> /about
app.useTrimTrailingSlash();

// Register routes
const routes = require("./routes");
routes(app);

// Health check endpoint
app.healthCheck("/health");

// Graceful shutdown hook
app.onShutdown(() => {
  console.log("Cleaning up resources...");
});

// 405 for known paths with the wrong method, then a custom HTML 404
app.useMethodNotAllowed();
app.notFound((_req, res) => {
  res.status(404).send("<h1>404</h1><p>Page not found.</p>");
});

// Error handler (returns JSON on errors)
app.useErrorHandler({ exposeStack: false });

// Start server
const PORT = process.env.PORT || 3000;
app.start(PORT);
