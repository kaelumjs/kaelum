const kaelum = require("kaelum");

const app = kaelum();

// enable basic safety + logs via setConfig
app.setConfig({
  cors: true,       // Enable CORS for cross-origin requests
  helmet: true,     // Add security headers
  logs: true,       // Log requests to console (using morgan)
  bodyParser: true, // Parse JSON and URL-encoded bodies (default true)
});

// mount routes
const routes = require("./routes");
routes(app);

// health check
app.healthCheck("/health");

// use Kaelum generic error handler (JSON responses)
app.useErrorHandler({ exposeStack: false });

// start server
const PORT = process.env.PORT || 4000;
app.start(PORT);