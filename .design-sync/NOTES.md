# design-sync notes — @enza/ui

## Origin (important context)
This component library did **not** exist before the first sync. The repo is a hand-authored
static marketing site (`index.html`, `css/style.css`, `js/script.js`). The `design-system/`
package was **created during the first /design-sync run** by extracting the site's design
language (tokens, type, components) from `css/style.css` into real React + TS components.
The live site is the visual source of truth; the package reproduces it.

## How the library is built
- Package: `@enza/ui` at `design-system/` (esbuild via **tsup**, ESM + d.ts).
- `npm --prefix design-system run build` → `dist/index.js` + `dist/index.d.ts`, then
  `scripts/copy-assets.mjs` copies `src/styles.css` → `dist/styles.css` and `src/fonts/` → `dist/fonts/`.
- CSS is **hand-authored** in `src/styles.css` (tokens + `@font-face` + component classes),
  NOT imported by the TSX. The converter ships it via `cfg.cssEntry: "dist/styles.css"`.
- Fonts (`anton-400`, `fredoka-*`) live in `design-system/src/fonts/`, copied from the site's `fonts/`.

## Converter invocation (run from repo root)
```
npm --prefix design-system run build
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./design-system/node_modules \
  --entry ./design-system/dist/index.js --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
```
- `PKG_DIR` resolves to `design-system/` (walked up from `--entry`), so `cfg.cssEntry` is package-relative.
- Playwright is staged in `.ds-sync/node_modules` (v1.61.1); chromium in `~/.cache/ms-playwright/` (chromium-1228).

## Gotchas learned
- `ServiceCardProps` must `Omit<HTMLAttributes, "title">` — its `title` prop (ReactNode) collides
  with the DOM `title: string` otherwise (dts build TS2430).
- Brand icons live in `src/icons.tsx` and are intentionally **not** exported from `index.ts`,
  so the converter does not treat them as standalone components.
- `TagRow` is exported alongside `Tag` (layout helper) — it will appear as its own component.

## Preview authoring conventions (learned in solo calibration)
- Components inherit the brand font (`--sans`) and ink (`--violet`) from an ancestor.
  **Every preview wraps its content in `<div className="enza-root" style={{background:"var(--paper)"}}>`**
  so chrome text + components render in Fredoka on the cream ground (the documented usage idiom).
- Made several component roots self-styling (`font-family:var(--sans)` on `.card`, `.timeline`,
  `.more-content`, `.contact-form`, `.eyebrow`) so they don't depend on the wrapper — but the
  wrapper is still the idiom for body/decorative text.
- `Timeline onDark`: added `.timeline.on-dark h3{color:#fff}` — entry titles were deep-red on the
  deep-red ground (invisible) before the fix.
- ServiceCard at full container width makes the 1:1 image fill the cell and push the body out of
  frame — wrap single-card previews in `maxWidth:300`. In a 2-col grid they're fine.
- Card images in previews use inline `data:image/svg+xml` URIs (no network).

## Known render warns (accepted)
- `[FONT_MISSING]` for "Trebuchet MS", "Haettenschweiler", "Arial Narrow", "Impact":
  these are **intentional generic fallback fonts** in the `--display`/`--sans` token stacks,
  NOT brand fonts. The brand fonts (Anton, Fredoka incl. latin-ext) ship correctly to `fonts/`.
  Accepted — no action; fallbacks never render once the brand woff2s load.

## Re-sync risks
- The library is a faithful re-creation, not upstream code. If `css/style.css` (the live site)
  changes, the package will drift from the site until manually updated — they are not auto-linked.
- Component count expected: 17 (16 named components + `TagRow`).
