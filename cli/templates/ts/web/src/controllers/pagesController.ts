// controllers/pagesController.ts
const path = require("path");

// Uses process.cwd() so it resolves from the project root in both
// development (tsx) and production (compiled dist/), since views/
// lives at the project root alongside src/.
const view = (file: string): string => path.join(process.cwd(), "views", file);

const home = (req: any, res: any): void => {
  res.sendFile(view("index.html"));
};

const about = (req: any, res: any): void => {
  res.send("<h1>About Kaelum</h1><p>A minimalist Node.js framework.</p>");
};

const team = (req: any, res: any): void => {
  res.send("<h1>Our Team</h1><p>Built by open-source contributors.</p>");
};

const dashboard = (req: any, res: any): void => {
  res.send("<h1>Dashboard</h1><p>Welcome, " + (req.user || "User") + "</p>");
};

const settings = (req: any, res: any): void => {
  res.send("<h1>Settings</h1><p>Adjust your preferences here.</p>");
};

export { home, about, team, dashboard, settings };
