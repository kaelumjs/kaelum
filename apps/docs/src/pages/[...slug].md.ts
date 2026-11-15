import type { APIRoute, GetStaticPaths } from "astro";
import { getMarkdownPages } from "../lib/markdown-route";

// Serves every docs page as raw Markdown at the same URL plus `.md`,
// e.g. /guide/features/etag/ -> /guide/features/etag.md
export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await getMarkdownPages();
  return pages.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
};

export const GET: APIRoute = ({ props, site }) => {
  const { entry } = props;
  const { title, description } = entry.data;
  const canonical = new URL(`/${entry.id}/`, site).href;

  const parts = [`# ${title}`];
  if (description) parts.push(`> ${description}`);
  parts.push(`Source: ${canonical}`);
  parts.push((entry.body ?? "").trim());

  return new Response(parts.join("\n\n") + "\n", {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
