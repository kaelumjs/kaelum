// routes.js
const pages = require("./controllers/pagesController");
const logger = require("./middlewares/logger");

// Mock auth middleware
const auth = (req, res, next) => {
  req.user = "Admin";
  next();
};

module.exports = (app) => {
  // Home page
  app.addRoute("/", pages.home);

  // Nested route example: /about and /about/team
  app.addRoute("/about", {
    get: pages.about,
    "/team": {
      get: pages.team,
    },
  });

  // Route group: shared prefix + middleware chain for the whole section
  const dashboard = app.group("/dashboard", logger, auth);

  // GET /dashboard
  dashboard.addRoute("/", { get: pages.dashboard });

  // GET /dashboard/settings
  dashboard.addRoute("/settings", { get: pages.settings });
};
