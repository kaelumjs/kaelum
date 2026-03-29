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

  // Middleware chain example
  const secureSection = [logger, auth];

  // Dashboard with nested settings, protected by middleware chain
  app.addRoute("/dashboard", {
    get: [...secureSection, pages.dashboard],
    "/settings": {
      get: [...secureSection, pages.settings],
    },
  });
};
