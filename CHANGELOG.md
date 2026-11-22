# Changelog

All notable changes to Vici are listed here. Versions follow [Semantic Versioning](https://semver.org/):
breaking changes to class names or token names bump the major version.

## Unreleased

- Key figures answer first: before anything runs, they show what the case puts at stake rather than a row of zeros,
  and each is named for what it shows on the first screen (the Data Quality Agent's “At stake a year”). The brief,
  Build a prototype and the guide page say so. A first screen that waits for the person to start the run is their
  turn: its “Your turn” bar holds the start button, and Play starts with it. `vc-attention` starts at once wherever
  the page waits for the person, and after a few quiet seconds on a step that Play has paused. The guide page's
  example of a figure span now uses `data-fig`, as its text does.
- Names, not record ids (from Rebate Hunter 8.0.0): a prototype's screen shows names, places and words, never the ids
  its data gives a record (vendor 10003, RA-CISCO, CC-1000), and one module turns ids into words, the agent's text and
  drafts included. The Writing guideline sets it out with a do and a don't, the prototype brief and the page structure
  point to it, and `recordIdProblems(text, ids)` in `scripts/lib/ids.mjs` lists every id of a prototype's data that
  still reaches a screen. `scripts/check-ids.mjs` proves it on planted ids and runs with `npm run check`.
- Key figures: a figure computed from part of the data says so in its value, such as “77 on 5 of 6 layers”, and a
  figure that needs all the data shows “…” until it is in (the Sovereignty Assessment). The brief, Build a prototype
  and the guide page say so. The guide page now names the figure spans of the presenting chapter `data-fig`, as the
  Price Variance Agent, Navigator and Duty Radar write them.
- Presenting step by step: where every step shows at once, Play walks the steps at reading pace and stops wherever a
  person acts, with a merlot “Your turn” callout above the action (the Price Variance Agent). `.vc-attention` draws the
  eye to the one primary action: a merlot ring pulses out three times, then rests as a soft frame until it is pressed;
  reduced motion keeps only the frame. `--vc-step-fill` (0 to 1) on a `vc-step` fills its rail towards the next step.
  The guide page has a demo of the turn, Motion lists Attention as a pattern, and the stepper demo shows a filling rail.
- How it works guide: a page in two languages may carry one guide per language. `guideProblems` accepts it when each
  guide says its language in `lang`, no two share one, and each is titled in its language, has its own header button
  and gives every key figure its row in its How it works chapter under the name in its language (`data-vc-kpi-de`
  beside `data-vc-kpi`). The guide page shows the pattern under Two languages, with the script that keeps the guide to
  once per tab across both languages, and says where `vici.js` notes that a guide has opened. The self-test plants five
  two-language mistakes and accepts the app starter with a German guide added.

## 1.0.0 — 2026-10-23

First release.

- Tokens: OKLCH colour ramps anchored on merlot `#250010` (merlot, coral, apricot, honey, sage, teal, fjord, lilac,
  linen neutrals, night surfaces), semantic light and dark themes, chart palettes, type scale, spacing, radii,
  hexagon cell sizes, shadows, motion, z-index, breakpoints.
- Hexagon shape system: flat-top cells, hex capsules, even-odd rings and hexagonal focus rings. Icon cells come in the
  status tones and in the pastel families, to match the tags and tiles of a category.
- More than forty components across actions, forms, content, navigation, feedback, overlays and data display. Avatars
  take any height through `--vc-avatar-size`.
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
  controls that grow with the reader's text size, a header, buttons and tags in clusters that wrap instead of overflowing
  at large text sizes,
  footer links of at least 32 px, reflow at 320 px, keyboard-scrollable tables and charts, tooltips in the top layer
  (also on every icon-only button of the starters and the docs header), toasts that work inside dialogs.
- Reading width: `--vc-container-prose` is 50ch, about 65 characters of Inter, inside the 55–75 the typography
  guideline asks for.
