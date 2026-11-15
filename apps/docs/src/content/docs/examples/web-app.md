---
title: Web Application
description: Build a complete web app with Kaelum.
sidebar:
  order: 1
---

## Setup

```bash
npx kaelum create my-website --template web
cd my-website && npm install
```

## app.js

```js
const kaelum = require("kaelum");
const routes = require("./routes");
const app = kaelum();

app.setConfig({
  static: "public",
  logs: "dev",
  port: 3000,
  views: { engine: "ejs", path: "./views" },
});

routes(app);
app.useErrorHandler();
app.start();
```

## routes.js

```js
module.exports = (app) => {
  app.addRoute("/", {
    get: (req, res) => res.render("index", { title: "Home" }),
  });

  app.addRoute("/about", {
    get: (req, res) => res.render("about", { title: "About" }),
  });

  app.addRoute("/contact", {
    get: (req, res) => res.render("contact", { title: "Contact" }),
    post: (req, res) => {
      console.log("Form:", req.body);
      res.redirect("/contact?sent=true");
    },
  });
};
```

## views/index.ejs

```html
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <h1><%= title %></h1>
  <nav>
    <a href="/">Home</a> |
    <a href="/about">About</a> |
    <a href="/contact">Contact</a>
  </nav>
</body>
</html>
```

:::tip
Files in `public/` are served at the root URL. `public/style.css` → `/style.css`.
:::
