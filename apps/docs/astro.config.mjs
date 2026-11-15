// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLlmsTxt from "starlight-llms-txt";
import starlightChangelogs, { makeChangelogsSidebarLinks } from "starlight-changelogs";
import { markdownPageIndex } from "./src/lib/llms-index.mjs";

const site = "https://kaelumjs.matthcodes.dev";

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    starlight({
      title: "Kaelum",
      description:
        "Kaelum is a minimalist Node.js framework for building web apps and REST APIs on top of Express.",
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        alt: "Kaelum logo",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/kaelumjs/kaelum",
        },
        {
          icon: "npm",
          label: "npm",
          href: "https://www.npmjs.com/package/kaelum",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/kaelumjs/kaelum/edit/main/apps/docs/",
      },
      customCss: ["./src/styles/custom.css"],
      components: {
        PageTitle: "./src/components/PageTitle.astro",
      },
      routeMiddleware: "./src/routeData.ts",
      plugins: [
        starlightLlmsTxt({
          projectName: "Kaelum",
          // Per-page index: every docs page is also served as raw Markdown at <url>.md
          details: markdownPageIndex(site),
          exclude: ["changelog/**"],
        }),
        starlightChangelogs(),
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            {
              label: "Introduction",
              items: [{ autogenerate: { directory: "getting-started/introduction" } }],
            },
            {
              label: "Configuration",
              items: [{ autogenerate: { directory: "getting-started/configuration" } }],
            },
          ],
        },
        {
          label: "Guide",
          items: [
            {
              label: "Core Functions",
              items: [{ autogenerate: { directory: "guide/core-functions" } }],
            },
            {
              label: "Features",
              items: [{ autogenerate: { directory: "guide/features" } }],
            },
          ],
        },
        {
          label: "API Reference",
          collapsed: true,
          items: [{ autogenerate: { directory: "api-reference" } }],
        },
        {
          label: "Examples",
          items: [{ autogenerate: { directory: "examples" } }],
        },
        {
          label: "Changelog",
          items: makeChangelogsSidebarLinks([
            { type: "all", base: "changelog", label: "All versions" },
            { type: "recent", base: "changelog", count: 3 },
          ]),
        },
      ],
    }),
  ],
});
