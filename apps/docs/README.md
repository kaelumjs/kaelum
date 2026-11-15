# Kaelum Docs

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

Official documentation site for [Kaelum](https://github.com/kaelumjs/kaelum) — a minimalist Node.js framework built on Express.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build), using Tailwind CSS v4.

## Development

```bash
npm install
npm run dev
```

The site will be available at `http://localhost:4321`.

## Commands

| Command           | Action                              |
| :---------------- | :---------------------------------- |
| `npm install`     | Install dependencies                |
| `npm run dev`     | Start local dev server              |
| `npm run build`   | Build production site to `./dist/`  |
| `npm run preview` | Preview production build locally    |

## Structure

```
src/
├── assets/                         # Logo and static images
├── components/
│   ├── override-components/        # Starlight component overrides
│   └── user-components/            # Custom MDX components
├── config/                         # Site, theme, sidebar, and nav config
├── content/docs/                   # Documentation pages (MDX)
└── styles/                         # Global CSS and Tailwind config
```

## Related

- Framework repository: [kaelumjs/kaelum](https://github.com/kaelumjs/kaelum)
- npm package: [kaelum](https://www.npmjs.com/package/kaelum)

## License

MIT — see [LICENSE](./LICENSE).
