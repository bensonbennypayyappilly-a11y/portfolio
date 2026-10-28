# Benson Benny: Portfolio

Personal portfolio for Benson Benny, product builder and founder of **LuvLit** and **OiDoit**.

A dependency-free static site (HTML, CSS, vanilla JS). No build step, so it deploys anywhere.

## What's inside

- **A story in one line (the homepage):** seven scroll-driven chapters, from an engineering degree in 2019, through the UK and Amazon back in India, to Recoora, LuvLit and OiDoit. One continuous line runs along the bottom and draws each chapter's scene as you scroll, while a little line-drawn me walks between scenes. Each chapter has its own muted colour. Jump between chapters with the ticks at the bottom right.
- **Selected work:** interactive demos of LuvLit (mini site builder), OiDoit (first-step finder) and Recoora (simulated Stripe alerts).
- **Toolkit:** hover or tap a skill to see where it was used.
- **The line continues:** contact, with the little me reaching for the lamp.
- **Pull-cord lamp theme switch:** drag the chain (or click it) to switch on the light. Dark is the default.
- A custom cursor on desktop, cursor-reactive name letters, word-by-word title reveals, and a command palette (`⌘K` / `Ctrl K` / `/`).
- Type: Cormorant Garamond (display), Jost (text and labels), Mrs Saint Delafield (signature accents), IBM Plex Mono (code bits).
- Keyboard accessible and respects `prefers-reduced-motion`.

### Editing the story

Chapter text lives in the `STORY` section of `index.html`. Each `.chapter` has `data-x` (where the little me stands, in the scene's 1440-wide coordinates), `data-pose` (`wave`, `carry`, `laptop` or `point`) and `data-name`. Each chapter's drawing is the matching `.scene` group in the SVG above, with paths sitting on the baseline at `y = 470`. Chapter colours are the `--sc0` to `--sc6` variables in `css/story.css`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Deploy

- **GitHub Pages:** Settings → Pages → Deploy from branch → pick the branch and `/ (root)`.
- **Vercel / Netlify:** import the repo. No build command, output directory is the repo root.

## Things to fill in

- **LinkedIn / X:** add them in the `contact-links` block in `index.html`.
- **Social preview image:** once deployed, change `og:image` in `index.html` to the absolute URL, for example `https://your-domain/og-image.png`.

## Structure

```
index.html        page markup and content
css/styles.css    design tokens, layout, components, responsive rules
css/story.css     the scroll story: stage, chapters, line and figure
js/main.js        interactions, demos, skill graph, command palette
js/story.js       the scroll story: chapter switching and line drawing
favicon.svg
og-image.png      1200×630 social preview
```
