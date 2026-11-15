import * as pages from "./controllers/pagesController";
import { logger } from "./middlewares/logger";

// Mock auth middleware
const auth = (req: any, res: any, next: any): void => {
  req.user = "Admin";
  next();
};

const routes = (app: any): void => {
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

export { routes };
