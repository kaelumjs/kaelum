import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const docsDir = fileURLToPath(new URL("../content/docs/", import.meta.url));

const sections = [
  ["getting-started", "Getting Started"],
  ["guide", "Guide"],
  ["reference", "Reference"],
];

/**
 * Builds the page index shown in `llms.txt`: one line per docs page, linking
 * to its raw Markdown version, grouped by top-level section.
 *
 * @param {string} site
 */
export function markdownPageIndex(site) {
  const pages = listMarkdownFiles(docsDir).map(readPage).filter(Boolean);
  const lines = ["Every page below is also available as raw Markdown at the linked URL."];

  for (const [dir, label] of sections) {
    const inSection = pages
      .filter((page) => page.slug.startsWith(`${dir}/`))
      .sort((a, b) => a.slug.localeCompare(b.slug));
    if (inSection.length === 0) continue;

    lines.push("", `### ${label}`, "");
    for (const page of inSection) {
      const summary = page.description ? `: ${page.description}` : "";
      lines.push(`- [${page.title}](${site}/${page.slug}.md)${summary}`);
    }
  }

  return lines.join("\n");
}

/** @param {string} dir @returns {string[]} */
function listMarkdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

/** @param {string} file */
function readPage(file) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(file, "utf8"))?.[1];
  if (!frontmatter) return;

  const title = field(frontmatter, "title");
  if (!title) return;

  const slug = path.relative(docsDir, file).split(path.sep).join("/").slice(0, -".md".length);
  return { slug, title, description: field(frontmatter, "description") };
}

/** @param {string} frontmatter @param {string} name */
function field(frontmatter, name) {
  const match = new RegExp(`^${name}:\s*(.+)$`, "m").exec(frontmatter);
  return match?.[1].trim().replace(/^["']|["']$/g, "");
}
