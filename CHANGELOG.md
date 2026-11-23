# Changelog

All notable changes to Vici are listed here. Versions follow [Semantic Versioning](https://semver.org/):
breaking changes to class names or token names bump the major version.

## Unreleased

- From PESTEL Challenger 0.1.0: the blank starter runs under a strict security policy. It carries a content
  security policy that lets in only the site's own scripts and styles, and has no inline script or style, so a
  prototype built on it runs under the same policy unchanged. `dist/vici-theme.js` applies the remembered theme before
  the first paint without an inline line, and `data-vc-theme-default="light"` on `<html>` sets the theme before anyone
  has chosen. `scripts/lib/policy.mjs` gives prototypes `policyProblems(html)`, and `npm run check` holds the blank
  starter to it. Getting started, Theming, Starters, Build a prototype and the brief say so. The app, dashboard and
  landing starters still inline their theme line and a few styles.
- From PESTEL Challenger 0.1.0: Nothing is kept, on Build a prototype. A prototype holds an API key, what a person
  enters or uploads and what its agents make in memory only: never in local or session storage, IndexedDB, the
  Cache API or a cookie, a URL, a log or an export. Only `vc-theme`, `<prefix>.lang` and the guide's `vc-guide:` note
  may persist, and a result leaves as a download the person starts. A live demo holds a test value in a variable and
  forgets it on reload. `scripts/lib/storage.mjs` gives prototypes `storageProblems()` for their scripts and
  `storedKeyProblems()` for what a run leaves behind; `npm run check` holds Vici's own scripts to the rule. The brief
  and the table of checks say so.
- From Duty Radar 2.1.0: Short forms and unfamiliar names in the Writing guideline. A short form the room can't
  expand (BStatG, MiLoAufzV) never carries a screen: the name in words, or the figure first and the short form on
  hover and for screen readers. A citation keeps its short form beside the name in words; a name the room has never
  heard (PflichtenLichten) says what it is where it first appears; a reason code reads as its words. The docs check
  requires the section, and the brief and Build a prototype point to it; the partner review puts any word you would
  have to look up on the fix list. Presenting step by step: once the person has decided, the step's title states the
  result.
- From Repack Pilot 0.7.0: where the story runs on between two steps, as its night does from one clock time to the
  next, Play counts that stretch in the step's reading time. It holds the step's moment for at least four seconds,
  plays on to the next step and opens it, so the walk keeps one pace and stops only where a person acts. The bar that
  asks says what pressing its action changes, in the visitor's words: “Confirm the agent's entry and the world model
  knows this barcode from now on”, where the button alone says “Confirm entry”. The guide page and the brief say so,
  and Build a prototype no longer names Repack Pilot for a Customer view and a Full view it dropped in 0.6.0.
- From Navigator 2.1.1: the bar under the story never covers what it asks about, so at a decision every option, doing
  nothing included, shows in full above it at 1280 × 720. Where the run starts by itself when the guide closes, the
  button for a live run says so, such as “Run it live”, and stands after the steps with the AI notice beside it, since
  a Start button before the steps invites a visitor to start what is already running. The guide page, Build a
  prototype and the brief say so.
- From the Sovereignty Assessment 2.0.0: Play holds until the story is over, on the last step too, so a decision that
  brings the next one (a lever, then its draft) keeps it playing; the talk track says a figure as its tile does, with
  the part of the data it rests on (“77 on 5 of 6 layers”). Numbers and units in the Writing guideline: a figure on part
  of the data, or with a side the sources leave open, says so in words, never with a question mark after the number.
- Presenting step by step (from Rebate Hunter 8.0.0): once the person has done the last step's action, Play ends at
  once and its button offers Replay, as the bar under the story does, rather than showing Pause beside a bar that says
  Done. A clock from detection to decision says when it has stopped (“stopped at your decision”), since “until your
  decision” reads as a countdown.
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
