# makefun-gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ernestopapa/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ernestopapa/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Cover Press — an offline web app that turns a photo into a neon-sunset cover in the style of a crime-saga game poster. Pick a layout, put photos in its panels, crop each one, pick a grade, write a caption in big genre lettering, and export a PNG.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>. No build step, no install, no network:
the app is static files, and photos stay on your machine (uploads are read
with object URLs and drawn locally).

Built for the make.fun `gta6-cover-art-01` bounty. It uses no Rockstar logo,
artwork, fonts or names: the two built-in sample photos were made for make.fun
with an image model, and the lettering is plain bold system sans-serif.

## What it does

- **Layouts** — Single (with a thin poster frame), Two panels, Four grid,
  Hero + three, and Full bleed. Click a panel in the preview to edit it.
  Switching to a layout with more panels fills any empty panel with the
  first photo already on the cover (same photo, no crop); a panel you
  filled yourself is never replaced.
- **Photos** — Upload your own photo, or use the built-in samples
  (`app/samples/pier.jpg`, `app/samples/boulevard.jpg`). Each panel holds its
  own photo. A sample button puts that photo in the panel being edited and
  in any panel that is still empty.
- **Per-panel crop** — Zoom (100–300%) and move the photo left/right and
  up/down inside its panel; reset the crop any time.
- **Grades** — Sunset (warm orange-to-pink wash), Neon (cyan/magenta overlay
  with boosted colour), Mono (black and white with a cool tint).
- **Caption** — Editable words (up to 40 characters), three styles (solid
  white, outline, colour band), size 60–160%, and position top, middle or
  bottom. The caption is drawn in big bold capitals and shrinks to fit.
- **Export** — PNG at 1080 × 1080 (square), 1080 × 1350 (portrait) or
  1920 × 1080 (wide), rendered client-side from the same drawing code as the
  preview. The square preview shows the cover as it looks at 1080 × 1080;
  at portrait or wide sizes the exported framing follows the chosen aspect
  ratio, so a wide export crops the photo top and bottom differently from
  the square preview (the subject's head is kept in frame).

## Files

- `app/index.html` — the page and controls.
- `app/style.css` — the dark editor theme.
- `app/src/main.js` — wires the controls, holds the cover state, exports PNGs.
- `app/src/cover.js` — draws the cover: layouts, per-panel crops, grades,
  caption.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=cover` shows the
  cover alone, `?shot=editor` shows the editor).
- `app/samples/` — the two built-in sample photos.
- `screenshots/` — 1-cover.jpg (hero + three, sunset, colour-band caption),
  2-editor.jpg (the editor, four grid, neon), 3-cover.jpg (full bleed, mono,
  outline caption).
- `main.ts` — the make.fun hand-in program: copies `app/` and `screenshots/`
  and writes `dossier.json` (unchanged from the starter).
- `serve.ts` — a tiny static server for local use (unchanged from the starter).

## Checks

- Exported the same cover twice in a headless browser: both PNGs had the
  same SHA-256, so the export is byte-identical run to run.
- `main.ts` run twice into two output folders produced identical output
  (including `dossier.json`).
- The app was loaded in a headless browser with no console errors and no
  request leaving the local machine.

---

<sub>Entered on [make.fun](https://make.fun/?ref=k9r60b8f&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
