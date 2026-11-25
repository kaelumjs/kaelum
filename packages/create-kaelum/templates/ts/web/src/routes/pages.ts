import type { Kaelum } from "kaelum";
import { fakeLogin } from "../middlewares/auth.ts";

export default function pages(app: Kaelum) {
  app.route("/", {
    get: (c) => c.render("index", { title: "Home" }),

    "/about": {
      get: (c) => c.render("about", { title: "About" }),
    },

    // `use` applies to this page and every page below it.
    "/dashboard": {
      use: [fakeLogin],
      get: (c) => c.render("dashboard", { title: "Dashboard" }),
    },
  });
}
