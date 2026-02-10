// routes.js
const pages = require("./controllers/pagesController");
const logger = require("./middlewares/logger");

// Mock auth middleware
const auth = (req, res, next) => {
  // Simulate auth check
  req.user = "Admin"; 
  next();
};

module.exports = (app) => {
  // Home
  app.addRoute("/", pages.home);

  // Nested Route Example: /about and /about/team
  app.addRoute("/about", {
    get: pages.about,
    "/team": {
      get: pages.team,
    },
  });

  // Middleware Chain Example
  const secureSection = [logger, auth];

  // Dashboard with nested settings, protected by middleware chain
  app.addRoute("/dashboard", {
    get: [...secureSection, pages.dashboard],
    "/settings": {
      get: [...secureSection, pages.settings],
    },
  });
};
