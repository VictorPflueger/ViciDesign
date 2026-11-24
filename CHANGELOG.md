# Changelog

All notable changes to Vici are listed here. Versions follow [Semantic Versioning](https://semver.org/):
breaking changes to class names or token names bump the major version.

## Unreleased

- From Prototype Ideator 0.3.0: a callout's actions keep to its ink as well. The callout already set its text and
  surface tokens, but a button, a link and a secondary button still took the page theme's accent: in the dark
  theme a secondary button put the callout's dark ink on the night's dark accent, at 1.4:1, and a link turned
  pale pink on the pastel, at 1.2:1. Inside a callout a button now keeps the light theme's merlot, a link the
  light theme's accent text, and a secondary button and its hover mix the callout's ink into its tone.
  `scripts/check-callout.mjs` also measures a secondary button's and a button's text on their fills, a link on
  the callout and a button's edge against the pastel, in every tone and theme.
- From Prototype Ideator 0.3.0: tables set tabular figures in number cells only. `.vc-table` and the classless
  table set them on every cell, and Inter's tabular figures also give the hyphen a figure's width, so a text cell
  read "person - days". Number cells, marked `.vc-num` or `data-type="number"`, keep them, in the classless table
  too; a number column without either mark now sets proportional figures. `scripts/check-figures.mjs`, part of
  the render checks, fails when a text cell sets a hyphenated word wider than a paragraph does, or when a number
  cell's figures differ in width.
- From Prototype Ideator 0.3.0: a callout gives its content every text and surface token in its own ink. It
  stays pastel in both themes, but `--vc-text-subtle`, `--vc-on-accent-soft`, `--vc-bg`, `--vc-bg-subtle`,
  `--vc-surface-raised`, `--vc-surface-hover` and `--vc-border-strong` still followed the page theme, so in the
  dark theme a note in subtle text, a hint in `--vc-on-accent-soft` or a box on `--vc-bg-subtle` turned pale on
  the pastel and vanished, at 1:1 to 1.6:1. `scripts/check-callout.mjs`, part of the render checks, puts a probe
  into a callout of every tone in the light theme and in both ways of setting the dark one, and fails when a text
  token falls below the ratio the token check asks for on the page.
- From SWOT Challenger 0.3.0: the live-run dialog, on the Overlays page. `.vc-live` is the dialog where a person
  hands a prototype their own API key and starts a live run, with its parts in a fixed order: the key, the setting,
  research and Advanced where a prototype has them, the budget cap, the acknowledgement, the estimate, and the start
  button in the footer with "You are interacting with an AI system" beside it. The key field sits in no form,
  carries `autocomplete="off"`, `spellcheck="false"`, `data-1p-ignore` and `data-lpignore="true"`, has a show
  button and a note on where the key stays, and a held key shows masked with "Forget key". The box is unticked at
  every opening and the start button disabled until the page enables it. Where the page finds what is usually
  private, a warning lists it above the footer; it warns and does not block. The body scrolls and the footer
  doesn't, so the start button and the notice stay in view at 1280 × 720. `liveDialogProblems(html)` in
  `scripts/lib/live.mjs` checks the parts, their order and every rule, with a self-test of planted mistakes, and
  Build a prototype and the brief list it. A slider's `<output>` with `data-vc-currency="EUR"` now shows its value
  as money in the language of the page around it, such as "€0.50" or "0,50 €".
- From PESTEL Challenger 0.2.0: the risk matrix and the horizon strip keep one column as wide as the figure. The
  figure's single column used to grow to the width of its numbers table once "Show the numbers" opened, so the
  grid above it stretched, its markers moved and the figure ran over whatever stood beside it. The table now
  scrolls in its own wrap and the grid stays where it was. The render check opens every figure's numbers and
  fails when that makes a risk matrix or horizon strip wider than it was closed.
- From PESTEL Challenger 0.2.0: the segmented control's radios take square corners. Each radio lies unseen over its
  whole option, and the browser's own radio is round, so a check of rendered shapes found a round element the
  size of every option. They now draw no radio of their own and have square corners.
- From Business Model Canvas Challenger 0.2.0: risk-matrix markers sized by what an issue puts at stake.
  `.vc-risk__marker--sm` and `--lg` either side of the default give three steps the prototype draws from its own
  figures, such as thirds of the largest; the key names each size used in words and the table carries the figures, so
  a size never stands for a number on its own. `riskMatrixProblems(html)` fails a sized marker whose size the key
  leaves unnamed, and the Data display page shows the sizes.
- From PESTEL Challenger 0.2.0: the horizon strip, on Data display. When the issues of a risk matrix arrive, in
  lanes for spans of time from left to right, such as now, in one to three years and later. Each lane names its
  span in words, an empty lane says so, and the issues sit in it as the risk matrix's own numbered markers, each
  an image named in words with its number, so the room follows one issue across both views. An arrow under the
  lanes shows which way time runs, and the numbers sit in a table one click away. It is one compact row that fits
  under a matrix at 1280 × 720. `horizonProblems(html)` checks the name, the lanes, the empty lanes, every marker's
  words, an issue in one lane only, a key for sized markers and the table, with a self-test of planted mistakes.
- From Prototype Ideator 0.2.0: the drop zone, on the Forms page. `.vc-dropzone` is the `<label>` of a real file
  input that stays in the tab order but out of sight, so a click, the keyboard and a screen reader all open the file
  dialog; `accept` names the kinds of file, and `.vc-dropzone__notice` says what may be uploaded. Dragged files turn
  the dashed edge solid and the zone the soft accent. vici.js sends dropped and chosen files as one cancelable
  `vc:files` event and clears the input; a page that checks files calls `preventDefault()` and lists them, otherwise
  Vici lists each with its size and a remove button. While a zone is on the page, a file dropped beside it is caught
  instead of opened, which would leave the page. Each file row has its name, kind and size, tags and a remove button
  that names it; `data-state="refused"` or `"warning"` adds the reason in words. `dropzoneProblems(html)` checks the
  input, its label, the notice, the list and every file, with a self-test of planted mistakes.
- From PESTEL Challenger 0.2.0: the ring, on the Framework view page. `.vc-ring` puts a subject in the centre and the
  six areas of a framework around it as flat-top hexagons, clockwise from the top, such as a company and the six
  dimensions of PESTEL. The order of the markup is the layout, so a strict security policy needs no style attribute.
  A cell takes an area's states with the same marks and words: under pressure (coral face, wide coral edge, the
  warning mark), on watch (honey, the eye) or addressed (sage, the check), in `.vc-ring__state`. Button cells select
  the area a list beside the ring shows, with `aria-pressed` and the accent edge, and focus draws a ring outside the
  cell. Forced colours repaint the edges and faces in system colours. `ringProblems(html)` checks the name, the
  order, the six names and every state's mark and word, with a self-test of planted mistakes.
- From Business Model Canvas Challenger 0.2.0: block states on the framework view. A whole area can be under pressure
  (coral edge, the warning mark and its issues in words, such as "2 issues · high"), on watch (honey edge, the eye and
  "1 issue · low") or addressed by a chosen answer (sage edge, the check and a word such as "Adapted"), and
  `data-source="ai"` says the AI completed it. Each state is a tag with a mark and a word in `.vc-framework__states`
  under the title, so it never rests on colour alone. Items gain a removed state (the minus mark, struck through,
  "Removed"), and an item a chosen answer rewords keeps its old text struck through above the new. `frameworkProblems(html)`
  checks the block states and removed items, and the Framework view page shows them.
- From SWOT Challenger 0.2.0: the risk matrix, on Data display. Five by five, impact up and likelihood across,
  each cell in its band (low 1 to 4, medium 5 to 9, high 10 to 15, critical 16 to 25) in the status colours, with
  its score in the corner and the bands named in a key, so nothing rests on colour alone. Issues are numbered
  hexagon markers in their cells, what is left after an answer a hollow marker, `aria-current` lights one, and the
  numbers sit in a table one click away. The grid places everything in the order of the markup, so it needs no
  style attribute under a strict policy. `scripts/lib/risk.mjs` gives prototypes `riskMatrixProblems(html)` and
  `band(score)`, and `npm run check` runs them with a self-test on the page.
- From SWOT Challenger 0.2.0: the framework view, a new component page. A strategy framework's areas (a SWOT's
  four fields, a PESTEL's six factors, a canvas's nine blocks) sit in `.vc-framework`, and every item is a `details`
  element whose state carries a mark and a word: entered, written by the AI (lilac, "AI"), added by the challenge
  (lilac, "Added"), challenged (coral edge, the fault in words) and addressed (sage, "Addressed"). `aria-current`
  points at the items a card elsewhere concerns, `.vc-framework--compact` shows first lines only, and a legend names
  every mark. `scripts/lib/framework.mjs` gives prototypes `frameworkProblems(html)`, and `npm run check` runs it with
  a self-test on the page. Build a prototype and the brief list the check.
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
