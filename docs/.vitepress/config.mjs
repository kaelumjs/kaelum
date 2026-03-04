import { defineConfig } from "vitepress";
import { markdownItImageSize } from "markdown-it-image-size";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from "vitepress-plugin-group-icons";
import path from "node:path";

export default defineConfig({
  base: "/kaelum/",
  title: "Kaelum",
  description: "Kaelum — Fast, minimalist framework for web apps & REST APIs",
  head: [
    ["link", { rel: "icon", href: "/kaelum/favicon.png" }],
    ["meta", { name: "theme-color", content: "#3ea0ff" }],
    ["meta", { name: "author", content: "Matheus Messias" }],
  ],
  themeConfig: {
    logo: { light: "/logo-black.svg", dark: "/logo-white.svg" },
    nav: [
      { text: "Home", link: "/" },
      { text: "Introduction", link: "/getting-started" },
      { text: "Guide", link: "/guides/features" },
      { text: "API", link: "/api/start" },
      {
        text: "Examples",
        items: [
          { text: "Web example", link: "/examples/web-example" },
          { text: "API example", link: "/examples/api-example" },
        ],
      },
      { text: "Changelog", link: "/misc/changelog" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "Philosophy", link: "/philosophy" },
          { text: "Why Kaelum?", link: "/why-kaelum" },
        ],
      },
      {
        text: "Guide",
        items: [
          { text: "Features", link: "/guides/features" },
          { text: "CLI", link: "/guides/cli" },
          { text: "Troubleshooting", link: "/guides/troubleshooting" },
        ],
      },
      {
        text: "API Reference",
        items: [
          { text: "start()", link: "/api/start" },
          { text: "addRoute()", link: "/api/addRoute" },
          { text: "apiRoute()", link: "/api/apiRoute" },
          { text: "setConfig()", link: "/api/setConfig" },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "Web example", link: "/examples/web-example" },
          { text: "API example", link: "/examples/api-example" },
        ],
      },
      {
        text: "Misc",
        items: [{ text: "Changelog", link: "misc/changelog" }],
      },
    ],

    outline: {
      level: [2, 3],
    },

    // Social / repo links
    socialLinks: [
      { icon: "github", link: "https://github.com/kaelumjs/kaelum" },
      { icon: "npm", link: "https://www.npmjs.com/package/kaelum" },
    ],

    // footer
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025 Kaelum",
    },

    // edit link template
    editLink: {
      pattern:
        "https://github.com/kaelumjs/kaelum/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },

  // site-wide markdown options
  markdown: {
    // languages used for twoslash and jsdocs in twoslash
    languages: ["ts", "js", "json"],
    codeTransformers: [transformerTwoslash()],
    config(md) {
      md.use(groupIconMdPlugin);
      md.use(markdownItImageSize, {
        publicDir: path.resolve(import.meta.dirname, "../public"),
      });
    },
  },
  vite: {
    plugins: [
      groupIconVitePlugin({
        customIcon: {
          firebase: "vscode-icons:file-type-firebase",
          ".gitlab-ci.yml": "vscode-icons:file-type-gitlab",
        },
      }),
    ],
    optimizeDeps: {
      include: ["@shikijs/vitepress-twoslash/client"],
    },
  },
});
