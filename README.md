# Benson Benny: Portfolio

Personal portfolio for Benson Benny, product builder and founder of **LuvLit** and **OiDoit**.

A dependency-free static site (HTML, CSS, vanilla JS). No build step, so it deploys anywhere.

## What's inside

- **Reactive hero:** a dot field that follows the cursor (and drifts on its own on touch screens), with a rotating tagline.
- **Three interactive product demos:**
  - **LuvLit:** a mini website builder. Type a business name, pick a type and colour, and the preview updates live.
  - **OiDoit:** a phone mock that suggests a tiny, shame-free first step for whatever you're putting off, with a timer.
  - **Recoora:** a live (simulated) Stripe event stream that raises alerts and types out AI-style retention ideas.
- **Changelog timeline:** career history as versioned releases, with a progress rail that fills as you scroll.
- **Skill graph:** hover or tap a skill to see where it was used (lines connect skills to roles on desktop).
- **Command palette:** press `⌘K` / `Ctrl K` (or `/`) to jump anywhere, copy the email or switch theme.
- Light and dark themes, keyboard accessible, and respects `prefers-reduced-motion`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Deploy

- **GitHub Pages:** Settings → Pages → Deploy from branch → pick the branch and `/ (root)`.
- **Vercel / Netlify:** import the repo. No build command, output directory is the repo root.

## Things to fill in

- **Recoora link:** in `index.html`, uncomment the link under the Recoora project and add the Vercel URL.
- **LinkedIn / X:** add them in the `contact-links` block in `index.html`.
- **Social preview image:** once deployed, change `og:image` in `index.html` to the absolute URL, for example `https://your-domain/og-image.png`.

## Structure

```
index.html        page markup and content
css/styles.css    design tokens, layout, components, responsive rules
js/main.js        interactions, demos, skill graph, command palette
favicon.svg
og-image.png      1200×630 social preview
```
