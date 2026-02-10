// controllers/pagesController.js
const path = require("path");

const view = (file) => path.join(process.cwd(), "views", file);

exports.home = (req, res) => {
  res.sendFile(view("index.html"));
};

exports.about = (req, res) => {
  res.send("<h1>About Kaelum</h1><p>A minimalist framework.</p>");
};

exports.team = (req, res) => {
  res.send("<h1>Our Team</h1><p>Built by open source contributors.</p>");
};

exports.dashboard = (req, res) => {
  res.send("<h1>Dashboard</h1><p>Welcome, " + (req.user || "User") + "</p>");
};

exports.settings = (req, res) => {
  res.send("<h1>Settings</h1><p>Adjust your preferences here.</p>");
};
