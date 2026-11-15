import { getCollection, type CollectionEntry } from "astro:content";
import type { StarlightRouteData } from "@astrojs/starlight/route-data";

type DocsEntry = CollectionEntry<"docs">;

let markdownIds: Promise<Set<string>> | undefined;

/** Docs entries that are served as raw Markdown at `/<id>.md`. */
export async function getMarkdownPages(): Promise<DocsEntry[]> {
  const docs = await getCollection("docs");
  return docs.filter(
    (entry) =>
      entry.filePath?.endsWith(".md") &&
      entry.data.template !== "splash" &&
      entry.id !== "index" &&
      entry.id !== "404",
  );
}

/**
 * Path of the raw Markdown version of the current page, or `undefined` when it
 * has none (the home page, the 404 page, plugin pages such as the changelog).
 */
export async function markdownPathFor(route: StarlightRouteData): Promise<string | undefined> {
  markdownIds ??= getMarkdownPages().then((pages) => new Set(pages.map((page) => page.id)));
  const ids = await markdownIds;
  return ids.has(route.id) ? `/${route.id}.md` : undefined;
}
