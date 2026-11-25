import kaelum from "kaelum";
import pages from "./routes/pages.ts";

const app = kaelum({
  static: "public",
  views: true,
  trailingSlash: "redirect",
  notFound: (c) => c.render("404", { title: "Page not found" }),
});

pages(app);

app.start();
