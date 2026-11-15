// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { viewTransitions } from "astro-vtbot/starlight-view-transitions";

import tailwindcss from "@tailwindcss/vite";
import config from "./src/config/config.json" assert { type: "json" };
import social from "./src/config/social.json";
import locals from "./src/config/locals.json";
import sidebar from "./src/config/sidebar.json";

import { fileURLToPath } from "url";

const { site } = config;
const { title, logo, logo_darkmode } = site;

export const locales = locals


// https://astro.build/config
export default defineConfig({
  site: "https://kaelumjs.matthcodes.dev",
  image: {
    service: { entrypoint: "astro/assets/services/noop" },
  },
  integrations: [
    starlight({
      title,
      description: "KaelumJS - A minimalist Node.js framework for building web pages and APIs with simplicity and speed.",
      head: [
        { tag: "meta", attrs: { name: "author", content: "Matheus Campagnolo" } },
        { tag: "meta", attrs: { name: "keywords", content: "Kaelum, KaelumJS, Node.js, Express, framework, backend, minimalist, API, Matheus Campagnolo" } },
        { tag: "meta", attrs: { property: "og:type", content: "website" } }
      ],
      logo: {
        light: logo,
        dark: logo_darkmode,
        alt: "Kaelum Logo",
      },
      // @ts-ignore
      social: social.main || [],
      locales,
      sidebar: sidebar.main || [],
      customCss: ["./src/styles/global.css"],
      components: {
        Head: "./src/components/override-components/Head.astro",
        Header: "./src/components/override-components/Header.astro",
        Hero: "./src/components/override-components/Hero.astro",
        PageFrame: "./src/components/override-components/PageFrame.astro",
        PageSidebar: "./src/components/override-components/PageSidebar.astro",
        TwoColumnContent: "./src/components/override-components/TwoColumnContent.astro",
        ContentPanel: "./src/components/override-components/ContentPanel.astro",
        Pagination: "./src/components/override-components/Pagination.astro",
        Sidebar: "./src/components/override-components/Sidebar.astro",


      },

    }),
  ],
  vite: {
    // @ts-ignore
    plugins: [tailwindcss(), viewTransitions()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
