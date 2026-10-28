# Benson Benny: Portfolio

Personal portfolio for Benson Benny, product builder and founder of **LuvLit** and **OiDoit**.

A dependency-free static site (HTML, CSS, vanilla JS). No build step, so it deploys anywhere.

## What's inside

- **Reactive hero:** a dot field that follows the cursor, a handwritten hello, name letters that get bolder as the cursor comes near, and paper stickers you can drag and throw around.
- **Pull-cord lamp theme switch:** drag the chain down (or click it) to switch on the light. The new theme spreads out from the lamp. Dark is the default.
- **Three interactive product demos:**
  - **LuvLit:** a mini website builder. Type a business name, pick a type and colour, and the preview updates live.
  - **OiDoit:** a phone mock that suggests a tiny, shame-free first step for whatever you're putting off, with a timer.
  - **Recoora:** a live (simulated) Stripe event stream that raises alerts and types out AI-style retention ideas.
- **Changelog timeline:** career history as versioned releases, with a progress rail that fills as you scroll.
- **Skill graph:** hover or tap a skill to see where it was used (lines connect skills to roles on desktop).
- **Command palette:** press `⌘K` / `Ctrl K` (or `/`) to jump anywhere, copy the email or switch theme.
- A custom cursor on desktop, a marquee that follows your scroll speed, word-by-word title reveals with hand-drawn underlines, tilting cards, and a footer signature that reacts to the cursor.
- Type: Fraunces (display), Bricolage Grotesque (text), Caveat (handwritten notes), IBM Plex Mono (code bits).
- Keyboard accessible and respects `prefers-reduced-motion`.

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
js/main.js        interactions, demos, skill graph, command palette
favicon.svg
og-image.png      1200×630 social preview
```
