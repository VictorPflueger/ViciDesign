# Changelog

All notable changes to Vici are listed here. Versions follow [Semantic Versioning](https://semver.org/):
breaking changes to class names or token names bump the major version.

## 1.0.0 — 2026-10-23

First release.

- Tokens: OKLCH colour ramps anchored on merlot `#250010` (merlot, coral, apricot, honey, sage, teal, fjord, lilac,
  linen neutrals, night surfaces), semantic light and dark themes, chart palettes, type scale, spacing, radii,
  hexagon cell sizes, shadows, motion, z-index, breakpoints.
- Hexagon shape system: flat-top cells, hex capsules, even-odd rings and hexagonal focus rings. Icon cells come in the
  status tones and in the pastel families, to match the tags and tiles of a category.
- More than forty components across actions, forms, content, navigation, feedback, overlays and data display.
- 64 original icons with hexagons in place of circles.
- Documentation site with live demos, generated swatches, contrast and token tables.
- Logo: Vertex, with colour, dark and mono versions, lockups, app icon, favicon and the wordmark. Five monogram options
  (Ligature, Stem, Cell, Seal, Initials), each in colour, dark, mono and as an avatar tile. Facet and Honeycomb are
  archived.
- Profile links: a "Built by" byline with Victor's portrait in a hexagon and LinkedIn's [in] logo, profile links for
  footers and contact sections, a Streamlit byline helper, rules for other brands' logos (their unchanged files, black or
  white via `--vc-platform-mark` and `--vc-platform-mark-filter`), with LinkedIn's [in] logo and GitHub's Invertocat in
  `assets/marks/` and the portrait in `assets/brand/`. Link rules: `rel="author"` in bylines and `rel="me"` on the
  personal site, canonical profile addresses, the personal site at https://victorpflueger.github.io/VIP/index.html for
  the time being, and no links from a project to its own GitHub repository unless that is specifically required.
- Licence: MIT for code, tokens, icons and docs; Victor Pflüger's name, portrait, logo, monogram and wordmarks
  reserved; fonts under the SIL Open Font License. The docs show it in full under Start → Licence.
- Starters: app prototype, dashboard, personal landing page, blank page.
- Integrations: Streamlit, Power BI, Python (matplotlib/plotly), Tailwind CSS v4.
- Checks: contrast, colour-blind separation of chart colours, hexagon rule, fonts, links, logos, exports, build freshness.
- Accessibility: Windows contrast themes (forced colours, with hexagon outlines for cells, tiles and avatars), rem-based
  controls that grow with the reader's text size, a header that wraps instead of overflowing at large text sizes,
  footer links of at least 32 px, reflow at 320 px, keyboard-scrollable tables and charts, tooltips in the top layer
  (also on every icon-only button of the starters and the docs header), toasts that work inside dialogs.
- Reading width: `--vc-container-prose` is 50ch, about 65 characters of Inter, inside the 55–75 the typography
  guideline asks for.
