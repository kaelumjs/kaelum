import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { changelogsLoader } from "starlight-changelogs/loader";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema(),
  }),
  changelogs: defineCollection({
    loader: changelogsLoader([
      {
        provider: "conventional-changelog",
        base: "changelog",
        title: "Changelog",
        // Written by release-please; lives next to the package it describes.
        changelog: "../../packages/kaelum/CHANGELOG.md",
      },
    ]),
  }),
};
