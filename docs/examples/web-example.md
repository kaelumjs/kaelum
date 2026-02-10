# Web App Template Guide

The **Web Template** is perfect for server-side rendered applications or simple websites. It comes configured to serve static files and HTML views.

To generate a Web project:

```bash
npx kaelum create my-web --template web
```

## Project Structure

```text
my-web/
├── public/               # Static assets (CSS, JS, images)
│   └── style.css
├── views/                # HTML templates/pages
│   └── index.html
├── app.js                # App entry point
├── routes.js             # Route definitions
└── package.json
```

## Key Files Explained

### 1. `app.js`

Configures the app to serve static files from the `public` folder.

```js
const kaelum = require("kaelum");
const app = kaelum();

app.setConfig({
  static: "public", // Serve files from ./public automatically
  helmet: true,     // Security headers
  logs: true,       // Request logging
});

require("./routes")(app);

app.start(process.env.PORT || 3000);
```

### 2. `routes.js`

Handles routing logic. Since Kaelum is agnostic to template engines, you can simply send HTML files using standard Express methods.

```js
const path = require("path");

const pages = require("./controllers/pagesController");
const auth = require("./middlewares/auth");

module.exports = function (app) {
  app.addRoute("/", pages.home);

  // Nested Route
  app.addRoute("/about", {
    get: pages.about,
    "/team": {
        get: pages.team
     }
  });

  // Middleware Chain
  const secure = [auth];

  app.addRoute("/dashboard", {
    get: [...secure, pages.dashboard],
    "/settings": {
        get: [...secure, pages.settings]
    }
  });
};
```

## How to Adapt and Extend

### Serving Static Assets

Place your CSS, client-side JS, and images in the `public/` folder. They are accessible at the root URL.

*   `public/style.css` -> `http://localhost:3000/style.css`
*   `public/logo.png` -> `http://localhost:3000/logo.png`

In your HTML:
```html
<link rel="stylesheet" href="/style.css">
```

### Adding Pages

1.  Create `views/contact.html`.
2.  Add a route in `routes.js`:

    ```js
    app.addRoute("/contact", {
      get: (req, res) => {
        res.sendFile(path.join(process.cwd(), "views", "contact.html"));
      }
    });
    ```

### Using a Template Engine (EJS, Pug, etc.)

Kaelum wraps Express, so you can use standard Express view engines.

1.  Install the engine: `npm install ejs`
2.  Configure it in `app.js`:

    ```js
    // Access the underlying Express app via app.locals or configuration if needed, 
    // but easiest is to treat 'app' as the express app it is (with helpers attached).
    app.set("view engine", "ejs");
    app.set("views", "./views");
    ```
    
    *(Note: Kaelum returns an Express app instance, so standard `app.set` works directly.)*

3.  Render in routes:
    ```js
    res.render("index", { title: "Home" });
    ```
