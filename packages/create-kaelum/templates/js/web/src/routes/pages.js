import { readFileSync } from "node:fs";
import { defineRoutes } from "kaelum";
import { fakeLogin } from "../middlewares/auth.js";

const home = readFileSync(new URL("../../views/index.html", import.meta.url), "utf8");

const page = (title, body) =>
  `<!doctype html><title>${title}</title><link rel="stylesheet" href="/style.css"><main class="container">${body}</main>`;

export const pageRoutes = defineRoutes("/")({
  get: (c) => c.html(home),

  // Nested routes: /about and /about/team
  "/about": {
    get: (c) => c.html(page("About", "<h1>About</h1><p>Built with Kaelum.</p>")),
    "/team": {
      get: (c) => c.html(page("Team", "<h1>Team</h1><p>Open-source contributors.</p>")),
    },
  },

  // `use` applies to this level and everything below it
  "/dashboard": {
    use: [fakeLogin],
    get: (c) => c.html(page("Dashboard", `<h1>Dashboard</h1><p>Welcome, ${c.res.raw.locals.user}.</p>`)),
    "/settings": {
      get: (c) => c.html(page("Settings", "<h1>Settings</h1>")),
    },
  },
});
