import kaelum from "kaelum";
import users from "./routes/users.js";

// Security headers, request IDs, logs, a body size limit, GET /health and
// graceful shutdown are on by default.
const app = kaelum({
  security: { cors: true },
});

users(app);

app.start();
