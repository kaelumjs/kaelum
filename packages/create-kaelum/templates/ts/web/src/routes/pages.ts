import type { Kaelum } from "kaelum";
import { fakeLogin } from "../middlewares/auth.ts";

// The home page is public/index.html. These pages render EJS views.
export default function pages(app: Kaelum) {
  app.route("/about", {
    get: (c) => c.render("about", { title: "About" }),
  });

  // `use` applies to this page and every page below it.
  app.route("/dashboard", {
    use: [fakeLogin],
    get: (c) => c.render("dashboard", { title: "Dashboard" }),
  });
}
