const kaelum = require("kaelum");

const app = kaelum();

// Enable basic security + static serving via setConfig (uses Kaelum internals)
app.setConfig({
  cors: true,
  helmet: true,
  static: "public", // will serve ./public
  bodyParser: true, // default enabled — explicit for clarity
  // views: { engine: 'ejs', path: './views' },
});

// Register routes (routes.js uses Kaelum helpers)
const routes = require("./routes");
routes(app);

// optional: health check endpoint
app.healthCheck("/health");

// install Kaelum default error handler (returns JSON on errors)
app.useErrorHandler({ exposeStack: false });

// Start server (explicit port for template demo)
const PORT = process.env.PORT || 3000;
app.start(PORT);