# Benson Benny: Portfolio

Personal portfolio for Benson Benny, product builder and founder of **LuvLit** and **OiDoit**.

A dependency-free static site (HTML, CSS, vanilla JS). No build step, so it deploys anywhere.

## What's inside

- **A story in one line (the homepage):** one continuous, film-like panorama in seven chapters, from an engineering degree in Tamil Nadu (with a gopuram), through the UK (Tower Bridge and the London Eye), a flight home to India (the Taj Mahal and an auto-rickshaw), to Recoora, LuvLit and OiDoit. As you scroll, the camera glides along the line with eased inertia, a glowing pen tip draws ahead of it, and each drawing forms as the pen passes. A little line-drawn me walks the whole way and takes a pose at each chapter. Background colours blend continuously, and drawings keep moving on their own: the Eye turns, clouds drift, the lamp sways, the flag flutters.
- **Music for the story:** a "Play music" button in the story bar starts an ambient score generated live in the browser with the Web Audio API (no audio files, nothing licensed). Soft pad chords change with each chapter and plucked notes wander over them; it fades out when you scroll past the story and back in when you return. It is also in the command palette.
- **Selected work:** interactive demos of LuvLit (mini site builder), OiDoit (first-step finder) and Recoora (simulated Stripe alerts).
- **Toolkit:** hover or tap a skill to see where it was used.
- **The line continues:** contact, with the little me reaching for the lamp.
- **Pull-cord lamp theme switch:** drag the chain (or click it) to switch on the light. Dark is the default.
- A custom cursor on desktop, cursor-reactive name letters, word-by-word title reveals, and a command palette (`⌘K` / `Ctrl K` / `/`).
- Type: Cormorant Garamond (display), Jost (text and labels), Mrs Saint Delafield (signature accents), IBM Plex Mono (code bits).
- Keyboard accessible and respects `prefers-reduced-motion`.

### Editing the story

Chapter text lives in the `STORY` section of `index.html`. Each `.chapter` has `data-pose` (`wave`, `carry`, `laptop` or `point`) and `data-name`. Each chapter's drawing is the matching `.scene` group in the SVG above: scenes sit 1400 units apart, and paths with the `draw` class are revealed as the pen passes, sitting on the baseline at `y = 470`. Wrap a drawing in `spin`, `float`, `sway`, `drift`, `flag` or `flicker` to give it its own motion. Chapter colours are the `--sc0` to `--sc6` variables in `css/story.css`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Deploy

- **GitHub Pages:** Settings → Pages → Deploy from branch → pick the branch and `/ (root)`.
- **Vercel / Netlify:** import the repo. No build command, output directory is the repo root.

## Things to fill in

- **X or other profiles:** add them in the `contact-links` block in `index.html`, next to LinkedIn.
- **Social preview image:** once deployed, change `og:image` in `index.html` to the absolute URL, for example `https://your-domain/og-image.png`.

## Structure

```
index.html        page markup and content
css/styles.css    design tokens, layout, components, responsive rules
css/story.css     the scroll story: stage, chapters, line and figure
css/sketch.css    the rest of the page in the story's ink: chapter-colour bands, hand-drawn edges
js/main.js        interactions, demos, skill graph, command palette
js/story.js       the scroll story: camera, pen, figure and chapter text
js/music.js       the generated ambient score
favicon.svg
og-image.png      1200×630 social preview
```
