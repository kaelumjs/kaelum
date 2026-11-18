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
        "Kaelum is Express, production-ready by default: typed route trees, schema validation and secure defaults for Node.js.",
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
      customCss: ["@fontsource-variable/inter", "./src/styles/custom.css"],
      components: {
        Hero: "./src/components/Hero.astro",
        PageTitle: "./src/components/PageTitle.astro",
      },
      expressiveCode: {
        styleOverrides: {
          borderRadius: "0.875rem",
          codeFontSize: "0.85rem",
        },
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
          items: [{ autogenerate: { directory: "getting-started" } }],
        },
        {
          label: "Guide",
          items: [{ autogenerate: { directory: "guide" } }],
        },
        {
          label: "Reference",
          items: [{ autogenerate: { directory: "reference" } }],
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
