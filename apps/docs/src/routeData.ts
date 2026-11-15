import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import { markdownPathFor } from "./lib/markdown-route";

// Advertise the raw Markdown version of each docs page to crawlers and agents.
export const onRequest = defineRouteMiddleware(async (context) => {
  const route = context.locals.starlightRoute;
  const href = await markdownPathFor(route);
  if (!href) return;

  route.head.push({
    tag: "link",
    attrs: { rel: "alternate", type: "text/markdown", href },
  });
});
