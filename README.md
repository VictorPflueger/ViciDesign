<p align="center">
  <img src="assets/logo/vertex/lockup.svg" alt="Victor Pflüger" height="56">
</p>

<h1 align="center">Vici Design System</h1>

<p align="center">
  A personal design system for prototypes, websites and data products.<br>
  Hexagons instead of circles · merlot <code>#250010</code> with pastel families · light and dark themes · one stylesheet, no build step.
</p>

---

## Quick start

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/VictorPflueger/ViciDesign@main/dist/vici.min.css">
<script src="https://cdn.jsdelivr.net/gh/VictorPflueger/ViciDesign@main/dist/vici.js" defer></script>

<button class="vc-button">Primary action</button>
<span class="vc-avatar">VP</span>
```

Pin a release tag (`@v1.0.0`) instead of `@main` for anything that has to stay stable. For offline work or sites that must not
load third-party resources, copy `dist/` and `assets/fonts/` into the project and keep their relative positions.

The documentation site, with live demos and copyable code for every component, is the root of this repository
(`index.html`). Switch on **GitHub Pages → Deploy from a branch → `main` / root** to publish it at
`https://victorpflueger.github.io/ViciDesign/`, or open `index.html` locally.

## The concept

| | |
|---|---|
| **Cells, not circles** | Anything that would be round is a flat-top hexagon: avatars, radios, switch knobs, slider thumbs, badges, spinners, progress rings, pagination, steppers, bullets, rating cells and the round parts of every icon. Pills become *hex capsules* with pointed ends. Rectangles keep small radii. |
| **Deep base, soft light** | Merlot `#250010` is the ink in light mode, the fill of primary actions and the canvas in dark mode. Eight OKLCH-generated families (merlot, coral, apricot, honey, sage, teal, fjord, lilac) plus linen neutrals carry meaning, and their pastel steps carry the atmosphere. |
| **Data first** | Tabular figures everywhere numbers live, a categorical chart palette checked against colour-blindness simulations, KPI cards, sortable tables, SVG chart examples. |
| **Zero friction** | Plain CSS in cascade layers plus a small optional script. Plain HTML is styled without classes. No framework, no dependencies. |
| **Accessible by default** | Every semantic colour pair meets WCAG 2.2 AA in both themes (verified by `npm run check`). Visible focus everywhere, hexagonal on hexagon controls, and reduced-motion support. |

## What's inside

- **Guidelines:** principles, colour and colour coding, typography, hexagon geometry, layout and spacing, elevation, motion, iconography, data visualisation, accessibility.
- **Components:** button, icon button, toggle and button group, link, segmented control · field, text input, textarea, select, combobox, date/number/file inputs, checkbox, radio, switch, slider, chip, rating · card, accordion, list and list group, divider, tag, badge, avatar and avatar group, presence, timeline, honeycomb tile, code block · header, side navigation, footer, tabs, breadcrumb, pagination, stepper, carousel · alert and banner, callout, toast, tooltip, progress bar, hex progress, spinner, skeleton, empty state · dialog, drawer, menu, popover · table, stat card, sparkline, legend, chart frame.
- **Brand:** five logo concepts (Vertex, Facet, Honeycomb, Monogram, Wordmark) in colour, dark and mono, plus an app icon, a favicon and lockups.
- **Starters:** an app prototype, a data dashboard, a personal landing page and a blank page in `starters/`.
- **Integrations:** Streamlit theme, Power BI theme, Python palette for matplotlib/plotly, Tailwind CSS v4 theme, all generated from the same tokens.
- **Icons:** 64 original line icons on a 24 px grid. Every round form in them is drawn as a hexagon.

## Typography

| Role | Typeface | Licence |
|---|---|---|
| Display: headlines, KPIs, wordmark | Bricolage Grotesque (variable: weight + optical size) | SIL OFL 1.1 |
| Text and UI | Inter (variable: weight + optical size, italic) | SIL OFL 1.1 |
| Code and data | JetBrains Mono (variable: weight) | SIL OFL 1.1 |

All fonts are self-hosted in `assets/fonts/`, so no font is requested from a third-party server.

## Repository layout

```
dist/                 vici.css · vici.min.css · vici-tokens.css · vici.js · vici-icons.svg · tokens.json   (generated)
assets/fonts/         WOFF2 files + OFL licences
assets/logo/          logo concepts as SVG                                                               (generated)
src/tokens/           tokens.json — the single source of truth (DTCG-style)
src/css/              base, shape (hexagon geometry), layout, utilities, components/*.css
src/js/vici.js        optional behaviours
src/icons/            one SVG per icon
src/docs/             documentation page sources, layout, docs styles
src/starters/         starter page sources
src/brand/            outlined wordmark paths
scripts/              build.mjs, palette.mjs, checks, brand/wordmark.py
integrations/         Streamlit, Power BI, Python, Tailwind                                            (generated)
index.html, start/, guidelines/, components/, brand/, starters/   documentation site                   (generated)
```

## Working on Vici

Requires Node 18+. There are no dependencies to install.

```sh
node scripts/build.mjs      # regenerate dist/, docs pages, logos and integrations
npm run check               # contrast, hexagon rule, fonts, links, logos, exports, build freshness
npm run palette             # after editing scripts/palette.mjs: regenerate the colour ramps and rebuild
npm run check:render        # optional: render every page in Chromium (needs Playwright)
```

Generated files are committed, so the CDN links and GitHub Pages work without a build server. `npm run check` fails if a
generated file is stale.

## Licence

The fonts in `assets/fonts/` are licensed under the SIL Open Font License 1.1 (see the `OFL-*.txt` files next to them).
No licence has been chosen for the rest of this repository yet.
