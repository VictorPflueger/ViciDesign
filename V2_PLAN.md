# ViciDesign 2.0: plan

Status: Phases 1 and 2 done on 19 November 2026 against `main` at `fdd868b`. Approved the same day: scope Full, and D1 to D14 as recommended, except D10, which the Full scope overrides (the 21 icons ship in 2.0). Phase 3 in progress.

## Summary

- Verdicts on 1.0: **steve-jobs-design-review** NOT DONE, 4/10. **ux-heuristics** 4/10. **impeccable** critique: home 24/40, Getting started 22/40, Hexagon 29/40, Actions 26/40. Audit: 13, 14, 15 and 16 out of 20.
- The worst defect: the pinned CDN link on Getting started (`@v1.0.0`) doesn't resolve, because the repository has no tags. Anyone who follows the production advice gets an unstyled page (F01).
- The system's parts are specific to Vici and well checked. The pages around them read as a template: an eyebrow over all 26 page titles, an aurora hero, icon-card grids, and four navigation systems pointing at the same 26 pages.
- 2.0 adds the How it works guide, makes the byline complete and checked on every surface, moves danger away from merlot and the status colours away from each other, and rebuilds the site around one job: a cold start to a working, signed page in five minutes.
- Recommended scope: Medium (section 7). Fourteen decisions need your answer (section 6); approving the recommendations is one answer.

## The One Thing

**From a cold start to a working page that is visibly Victor's, in five minutes.**

This keeps your working assumption and sharpens two words, because the reviews showed both are vague in practice.

- "Someone new" is almost always an AI agent in a fresh session, or you after weeks away, since only you and your agents build with Vici. Colleagues and partners never build; they judge. So the five-minute path has to work from text alone (exact, copyable, nothing to guess), and the one-minute understanding has to come from seeing real pages built with Vici, not from descriptions of it.
- "On-brand" becomes something a check can verify: the page carries your byline, and a prototype, demo or challenge opens with its How it works guide. Hexagons and merlot come free with the stylesheet. The signature doesn't, today: two of four starters have no byline and none links to your website (F04, F05).

How Phase 5 tests it: a fresh agent session given only the docs address builds a page from Getting started, counting steps and minutes; and the home page is judged on what a first-time viewer learns in one minute.

## No-list

2.0 deliberately won't:

- add a framework, a package to install, a build step for users or any dependency;
- change the fonts (Inter stays, as the brief says), the hexagon geometry, the merlot base or the token names, apart from the two retirements in section 1;
- redraw or move the Vertex logo, wordmark, monograms or portrait, or decide the monogram;
- show screenshots of the prototypes (links only, as you confirmed);
- turn the home page into a marketing page; it stays the front page of documentation;
- use eyebrows, kickers, aurora gradients, decorative icon grids or numbered headings that aren't steps;
- add a search service, analytics or any third-party request (search is a static index);
- build a custom select, date picker or data grid (still left out on purpose);
- translate the docs site (it stays in British English; the guide's built-in words are translatable for German prototypes);
- change the prototypes themselves; they move to 2.0 in their own repositories after the release.

## 1. System (Phase 3)

Order of work, as the brief sets it: tokens and palette, component CSS and `src/js/vici.js`, icons, then the rules on the Guidelines and Brand pages. **impeccable** `extract`, `layout`, `typeset`, `quieter` and `harden` run on the components and `clarify` on the rules. After each step: `node scripts/build.mjs` and `npm run check`, with failures fixed before moving on.

### Tokens and palette

| Change | Why | Approval |
|---|---|---|
| Keep danger at least ΔOK 0.10 from `--vc-accent` and `--vc-accent-text` in both themes. Done in Phase 3: in dark mode danger moved (coral 500 solid, coral 400 text); in light mode no danger red dark enough for text gets that far from merlot 700, so `--vc-accent-text` moved to merlot 800 and links keep merlot 700 | Brand text and the dark-mode primary action read as error colours today (F11, F13) | Yes, D4 (non-negotiables 2 and 5); final values in `v2-status-colours.html` |
| Spread the status solids in lightness: danger and success at least 0.08 apart in OKLCH lightness in both themes, warning and info distinct from both | Danger, success and info share one lightness, so colour-blind viewers can't tell them apart by colour (F12) | Yes, D4 |
| Separate `--vc-surface-selected` from `--vc-danger-bg` by at least ΔOK 0.04 | A selected row looks like an error row (F31) | Yes, D4 |
| Retire `--vc-aurora-1`, `--vc-aurora-2`, `--vc-aurora-3` with `.vc-bg-aurora` | Template tell (F16, hypothesis 3) | Yes, D3 (breaking) |
| Add `src/brand/profile.json` (name, LinkedIn, GitHub, website) as the one source the build uses for every byline and profile link | The website address is typed by hand today and will change when the site moves to its own domain (F04) | No |
| Generate `Vici.version` and every pinned CDN address from `package.json` | 1.0.0 is typed in four places and the pin points at a tag that doesn't exist (F01, F42) | No |

Values come out of `scripts/palette.mjs` and `npm run palette`. Every pair keeps WCAG 2.2 AA, and the new distances become rules in `check-tokens`. You see before and after swatches at the end of Phase 3. No other token changes: type scale, spacing, radii, cell sizes, shadows, motion and layers stay.

### Type

- Fonts unchanged: Bricolage Grotesque for display, Inter for text, JetBrains Mono for code.
- The "Eyebrow · section label" style leaves the type system (F14). Capitals stay for table column headers and for status words that must read from across a room, such as SIMULATION and LIVE in the prototypes.
- Leads shrink to one or two sentences of at most 40 words, a Writing rule (F28, F44). The type scale itself doesn't change.

### Components and script

| Part | 2.0 | Findings |
|---|---|---|
| `vc-guide` (new) | Built on `vc-dialog` and `vc-stepper`, with its behaviour in `src/js/vici.js` (section 3); carries the fixes Dispatch Lab's guide needs | F07, F08, F33, F34, F35 |
| Byline | Keeps its classes; the website link becomes a required part (section 2) | F04, F05, F06 |
| Stepper | Steps can be buttons, with the hexagonal focus ring on the marker, so the guide's chapter rail needs no custom CSS (Dispatch Lab styles its own `.guide-nav-btn` today) | F07 |
| Dialog | A guide size that fills the screen at 600 px and below | F07 |
| `.vc-eyebrow`, `.vc-bg-aurora` | Retired, if you approve D3 | F14, F16 |
| Cells | No CSS change; the rule changes so cells carry meaning (status, category, a person) and never decorate card grids | F27 |
| Inline styles | **impeccable** `extract` turns the 148 inline `style` attributes in the docs sources into Vici utilities where they repeat and docs scaffolding where they only frame demos | F36 |
| Edge cases | **impeccable** `harden` tries the guide with one chapter and with eight, long titles, German words, no script, blocked storage and 320 px, and the byline with blocked images and large text | F07, F04 |

### Icons

Neither the byline nor the guide needs a new icon: `globe-hex`, `info`, `close`, the chevrons and `play` exist. The 21 concepts your prototypes need (stop, radar, receipt and the rest) are decision D10; the recommendation is 2.1, after the prototypes move.

### Guidelines and Brand rules

What the rules say changes in Phase 3; how the site presents them changes in Phase 4.

| Page | New or changed rule | Findings |
|---|---|---|
| Writing (new, Guidelines) | Voice, headings, labels, numbers and units, English and German conventions, and the patterns Vici doesn't use: eyebrows and kickers, middle dots stapling fragments into taglines, numbered headings that aren't steps, stock AI words | F14, F15, F44 |
| Principles | Unnumbered; adds two obligations: every surface is signed (byline) and every prototype, demo and challenge explains itself (guide) | F15, F05, F07 |
| Typography | Eyebrow style removed; when capitals are allowed | F14 |
| Colour | Status separation rule and values; atmosphere from flat pastel grounds, never blurred gradients | F11, F12, F13, F16, F31 |
| Hexagon | Cells carry meaning; the honeycomb layout only for real content such as topics on the personal site | F27 |
| Layout and spacing | Absorbs Elevation (surfaces, shadows, layers) | F21 |
| Accessibility | The guide's focus and keyboard pattern; link targets in the byline; `lang` on every page | F34, F38 |
| Byline and profile links (Brand) | Every prototype, demo and website, the personal site included; website link required; one source for addresses | F04, F05, F06 |
| How it works guide (new, Components) | Title pattern, chapters, copy rules, content format, behaviour, opening | F07, F08 |

**impeccable** `clarify` runs on every rule and **humanizer** on every new or rewritten paragraph.

### Breaking changes and migration

Removing a class or token is a breaking change under the changelog's rule, which is what makes this 2.0.0. Your prototypes keep their pinned 1.0.0 copy in `vici/` until you move them, so nothing breaks until then.

| Change | Migration from 1.x |
|---|---|
| `.vc-eyebrow` removed (D3) | Delete the element. If it carried information, such as a date or a status, put it after the heading as `.vc-caption` or a `.vc-tag`. In Dispatch Lab's guide, the chapter eyebrow goes; the rail and the count say the same. |
| `.vc-bg-aurora` and `--vc-aurora-1` to `-3` removed (D3) | Use the page background, `.vc-surface-subtle`, or a flat pastel section, `.vc-tint-<family>`, behind a hero. |
| Status and selection colours change value, names stay (D4) | Nothing to rename. Check charts or badges that copied the old hex values. |
| Byline needs the website link | Add the globe link (markup in section 2). Streamlit: replace `vici_byline.py` with the 2.0 copy from `integrations/streamlit/`. |
| Prototypes replace their own intro with `vc-guide` | Move the chapters into the guide markup (section 3). Dispatch Lab keeps computing its figures in `guide-content.js` and fills the figure slots on `vc:guidechange`. |
| CDN pins move to `@v2.0.0` | Tag `v2.0.0` on GitHub before the docs go live (D12). |

The 2.0.0 changelog entry repeats this table with a "Migrating from 1.x" section.

## 2. Byline 2.0

### Form

The byline your prototypes already carry becomes the standard: "Built by", your portrait in a hexagon, your name, LinkedIn's [in] mark, then a globe. The reviews found no reason to redesign it; it is the one element on the site nobody would take for a template. What needs fixing is where it appears: the docs and starters lack the globe (F04), two starters lack the byline (F05), and the rule exempts your personal site (F06).

```html
<p class="vc-byline">
  <span class="vc-byline__label">Built by</span>
  <a class="vc-byline__person" href="https://www.linkedin.com/in/victorpflueger" rel="author">
    <span class="vc-avatar vc-avatar--xs"><img src="…/portrait-96.jpg" alt=""></span>
    <span class="vc-byline__name">Victor Pflüger</span>
    <!-- LinkedIn's [in] mark -->
    <span class="vc-visually-hidden"> on LinkedIn</span>
  </a>
  <a class="vc-byline__icon" href="https://victorpflueger.github.io/VIP/index.html" rel="author" aria-label="Victor Pflüger's website">
    <span class="vc-icon vc-icon--globe-hex" aria-hidden="true"></span>
  </a>
</p>
```

### Rules

- Both links carry `rel="author"`. On the personal site the profile links elsewhere on the page keep `rel="me"`.
- Addresses come from `src/brand/profile.json`; the build writes them into the docs layout, the starters, the Streamlit helper and `llms.txt`. When the site moves to its own domain, one line changes.
- The globe link is at least 24 by 24 px, has the accessible name "Victor Pflüger's website" and a tooltip "Website".
- It sits at the end of a page: in the footer, or at the bottom of an app's sidebar. Never inside the guide or a dialog.
- Where a surface can't hold links, such as a Power BI report, its footer reads "Built by Victor Pflüger" with the website address.

### Where it must appear

| Surface | Today | 2.0 |
|---|---|---|
| Every docs page (26) and the new 404 page | Footer, LinkedIn only | Footer, both links |
| App and dashboard starters | Byline, LinkedIn only | Both links |
| Landing and blank starters | None | Both links |
| Streamlit helper `integrations/streamlit/vici_byline.py` | LinkedIn only | Both links, generated from `profile.json` |
| Personal website | Exempt by the current rule | Footer byline; the globe links to the site's own home page (D7) |
| Prototypes and demos | Globe present in the five you showed | Unchanged look, now the documented standard |

### Byline check

`scripts/check-byline.mjs` joins `npm run check` and fails when a docs page, the 404 page, a starter or the Streamlit helper lacks the byline or either link (section 5).

## 3. How it works standard

Applies to every prototype, demo, challenge and showcase built with Vici 2.0. Websites and other pages that aren't one of these (your personal site, the Vici docs, the landing starter) don't get one.

### Title pattern

| Kind | English title | German title |
|---|---|---|
| Prototype | How the prototype works | So funktioniert der Prototyp |
| Demo | How the demo works | So funktioniert die Demo |
| Challenge | How the challenge works | So funktioniert die Challenge |
| Showcase | How the showcase works | So funktioniert der Showcase |

The header button that reopens it reads "How it works" ("So funktioniert's" in German), with an icon and visible text.

### Chapters

| Position | Chapter id | Rail label | Required | Answers |
|---|---|---|---|---|
| First | `what` | What it does | Yes | What it is, who it is for, which question it answers |
| Second | `how` | How it works | Yes | Inputs, logic and outputs; what is simulated and what is real |
| Middle | free ids | Up to five words | No | For example results, how to read the page, limits; "how" may continue over several chapters |
| Last | `present` | How to present | Yes | The presenter's path: what to show, in which order, what to say, how long it takes |

Three to eight chapters in all; four to six read best. The last chapter's main button closes the guide and lands on the first step of the presenting path. Its label comes from the markup, "Start" by default; Dispatch Lab can keep "Watch the baseline".

The presenting chapter has three to seven steps. Each step names the control or view to show, gives one sentence to say, in quotation marks, and its minutes. The lead gives the total time. Where the prototype has a demo script, the chapter condenses it.

### Copy rules

- The heading is one claim in sentence case, at most 60 characters, specific to the product: a number or a noun from the prototype. No questions, no colon-kickers.
- The lead is one or two sentences, at most 40 words.
- The body is exactly one figure, table or short list (at most five items).
- Every number is computed from the prototype's own data, never typed.
- No eyebrow and no "Chapter n of N" label: position lives in the rail and the footer.
- Plain words, British English or German, tabular figures. The Writing guideline's banned patterns apply.

### Content format

The guide is HTML in the page. It works under a strict content security policy, needs no inline script, and the check can read it.

```html
<button type="button" class="vc-button vc-button--secondary" data-vc-guide-open="guide">
  <span class="vc-icon vc-icon--info" aria-hidden="true"></span>How it works
</button>

<dialog class="vc-dialog vc-guide" id="guide" aria-labelledby="guide-title"
        data-vc-guide data-vc-guide-auto data-vc-guide-count="{n} of {total}">
  <header class="vc-dialog__header">
    <h2 class="vc-dialog__title" id="guide-title">How the prototype works</h2>
    <button type="button" class="vc-icon-button" data-vc-close aria-label="Close">…</button>
  </header>
  <div class="vc-guide__chapters">
    <section class="vc-guide__chapter" data-vc-chapter="what" data-vc-nav="What it does">
      <h3>Finds 128 invoices that need a person</h3>
      <p class="vc-guide__lead">One or two sentences.</p>
      <figure>…</figure>
    </section>
    <section class="vc-guide__chapter" data-vc-chapter="how" data-vc-nav="How it works">…</section>
    <section class="vc-guide__chapter" data-vc-chapter="present" data-vc-nav="How to present">
      <h3>Show it in six minutes</h3>
      <p class="vc-guide__lead">Three steps, six minutes in all.</p>
      <ol class="vc-guide__path">
        <li><strong>Open the exception list.</strong> "These are the invoices the agent couldn't match." <span class="vc-guide__time">2 min</span></li>
      </ol>
    </section>
  </div>
  <footer class="vc-dialog__footer vc-guide__footer">
    <span class="vc-guide__count"></span>
    <button type="button" class="vc-button vc-button--ghost" data-vc-guide-back>Back</button>
    <button type="button" class="vc-button" data-vc-guide-next data-vc-guide-done="Start">Next</button>
  </footer>
</dialog>
```

`vici.js` builds the chapter rail from the sections. Every visible word is in the markup, as Vici already does for the theme toggle and the select status, so a German prototype writes "Zurück", "Weiter" and `data-vc-guide-count="{n} von {total}"`. An app that computes its figures, like Dispatch Lab, fills them when it receives `vc:guidechange`.

### Behaviour

- A modal `vc-dialog`: Escape and the close button close it, focus stays inside, and closing returns focus to whatever opened it.
- From 900 px the rail is a vertical stepper with numbers in hexagons; below that it is a horizontal strip; at 600 px and below the dialog fills the screen.
- The footer holds the count ("2 of 5", tabular figures), Back (disabled on the first chapter) and Next; on the last chapter Next becomes the closing action.
- On opening, focus goes to Next. On every change of chapter, focus moves to the new chapter's heading. No live region, so screen readers announce each chapter once (F34).
- Rail items are buttons; the current one has `aria-current="step"`.
- Instant change of chapter under reduced motion; hexagon outlines in Windows contrast themes.
- Events: `vc:guidechange` (chapter id and index) and `vc:guideclose` (the return value).

### Opening

Recommendation (D5): the guide opens by itself every time someone opens the prototype in a new tab, and not again when that tab reloads (session storage). `?guide=0` in the address keeps it closed, for a presenter who has already explained it; `?guide=present` opens it at the presenting chapter, or any chapter id at that chapter. The header button reopens it at the first chapter.

Today it opens only on a browser's first visit (F35). That hides it from anyone who saw it once, including a viewer on your laptop in a meeting. Opening on every load would interrupt reloads and presenters. Once per tab gives every new viewer the guide while leaving a working session alone.

### Check

`scripts/check-guide.mjs` joins `npm run check`. It reads the built app, dashboard and blank starters and fails when one has no guide, or when the guide breaks the standard: exactly one `dialog.vc-guide[data-vc-guide]` with `data-vc-guide-auto`; a title matching the pattern in English or German; chapters `what` first, `how` second and `present` last, three to eight in all; one heading, one lead and at most one figure, table or list in each; a presenting path of three to seven steps, each with a time; a header button with visible text; no eyebrow inside. A self-test plants a starter without a guide and one with a broken guide and confirms both fail. `check:render` adds the behaviour: opens on load, focus on Next, Next moves focus to the heading, Escape closes, the header button reopens, `?guide=0` and `?guide=present` work, full screen at 375 px.

The first guides: the app and blank starters get "How the prototype works", the dashboard starter "How the demo works". The blank starter's chapters say what to write in each place.

## 4. Website (Phase 4)

The site becomes the reference implementation: every page and starter passes the 2.0 checklist written at the end of Phase 3. Order: docs shell and navigation, home, Start, Guidelines, Components, Brand, then the four starters. **impeccable** `distill`, `clarify`, `layout`, `typeset`, `quieter`, `onboard` (Getting started), `harden` and `extract` run in each area, followed by the build, the checks and a **ux-heuristics** trunk test of that area's pages.

### Information architecture

Same four sections, still 26 pages. Four pages merge or move, three are new, and every section's first page now matches the link that opens it.

| Section | Pages, in order |
|---|---|
| Home | Home |
| Start | Getting started (with the starters), Tokens and theming, Integrations |
| Guidelines | Principles, Writing (new), Colour, Typography, Hexagon, Layout and spacing (with elevation), Motion, Icons, Data visualisation, Accessibility |
| Components | All components (new, A–Z), Actions, Forms, Content, Navigation, Feedback, Overlays, Data display, How it works guide (new) |
| Brand | Logo, Byline and profile links, Licence |

Outside the sections: a 404 page with search and the section links, small redirect pages at the four old addresses, and `llms.txt` for agents (F29, F30).

### Navigation

The header shows the logo, the four sections with the current one marked, search, and the theme switch. The sidebar shows only the current section's pages (F21). The menu button on phones carries the current section's name ("Components"), which replaces the eyebrow as the sign of where you are (F23). "On this page" sits in the right-hand column from 1280 px and as a short list under the lead below that (F22). The pager stays and names the section when the next page is in another one (F41). The home page's section cards go (F18).

### Search

Decision D8. A field in the header, or a button that opens it on phones. The build writes an index of pages, headings, components, class names and token names into a script file, so it works from disk without fetching anything. Docs-only code; `vici.js` stays free of it (F10).

### Home page

In order: the headline (kept), a lead that says what Vici is in one plain sentence (F44); one primary action, Get started, and one secondary, All components (F19); a slice of a real Vici page, the app starter, built from real components and linking to the full starter (F03); the two install lines, pinned to a tag that exists, with a copy button (F01); "Built with Vici", linking each live prototype that runs on Vici, with one line each and no screenshots; the footer with the byline. The aurora, the tiles, the principle grid, the section cards and the palette band go (F16, F17, F18).

### Getting started page

The five-minute path first: (1) copy a starter, four cards with a copy button each, saying which ones include the guide; (2) open it, since the starter already points at the CDN; (3) replace the content, keep the byline, write the guide's chapters. Then "Add Vici to an existing page" (the two lines), "Work offline" (the local copy, including where to get the files) and a pointer for agents to `llms.txt`. The reference half (files, changing the system, left out on purpose, browser support) moves to the end or into README (F02, F24, F25, F28). Headings are plain; the three steps are an ordered list.

### Old → new page map

| Old page | New page | Decision | What changes | Findings |
|---|---|---|---|---|
| `index.html` | `index.html` | Rewrite | One-sentence lead, a slice of a real page, the working install, links to the live prototypes on Vici; decoration and the Logo action go | F03, F16, F17, F18, F19, F40, F44 |
| `start/getting-started.html` | `start/getting-started.html` | Rewrite | Five-minute path with the four starters, then the two lines, then offline; reference moves out; copy buttons; plain headings | F01, F02, F15, F24, F25, F28, F29 |
| `start/starters.html` | `start/getting-started.html#starters` | Merge | Its cards become step 1 of Getting started; the old address redirects | F02, F24 |
| `start/theming.html` | `start/tokens.html#theming` | Merge | Theme islands and token overrides join the token reference; redirect | F20, F21 |
| `start/tokens.html` | `start/tokens.html` | Change | "Tokens and theming" in the sidebar and the heading alike | F20 |
| `start/integrations.html` | `start/integrations.html` | Change | Streamlit byline helper with both links; copy buttons | F04, F25 |
| `start/licence.html` | `brand/licence.html` | Move | Joins the reserved brand; the footer link stays; redirect | F43 |
| `guidelines/principles.html` | `guidelines/principles.html` | Change | Unnumbered; the two obligations; one name, "Principles" | F15, F20 |
| `guidelines/colour.html` | `guidelines/colour.html` | Change | Separation rule and the new status values; atmosphere from flat grounds | F11, F12, F13, F16, F31 |
| `guidelines/typography.html` | `guidelines/typography.html` | Change | Eyebrow style removed; when capitals are allowed | F14 |
| `guidelines/hexagon.html` | `guidelines/hexagon.html` | Change | Cells carry meaning; the anatomy label fixed; one name, "Hexagon" | F20, F27, F37 |
| `guidelines/layout.html` | `guidelines/layout.html` | Change | Absorbs Elevation; repeated inline styles extracted | F21, F36 |
| `guidelines/elevation.html` | `guidelines/layout.html#elevation` | Merge | Surfaces, shadows and layers move; redirect | F20, F21 |
| `guidelines/motion.html` | `guidelines/motion.html` | Keep | Shared template changes only | F14 |
| `guidelines/icons.html` | `guidelines/icons.html` | Change | One name, "Icons" | F20 |
| `guidelines/data-viz.html` | `guidelines/data-viz.html` | Change | Status colours in charts follow the separation rule | F12 |
| `guidelines/accessibility.html` | `guidelines/accessibility.html` | Change | The guide's focus and keyboard pattern; byline targets; `lang` | F34, F38 |
| `components/actions.html` | `components/actions.html` | Keep | Shared template; reachable from All components and search | F09, F14 |
| `components/forms.html` | `components/forms.html` | Keep | Shared template; in-page contents below 1280 px | F09, F22 |
| `components/content.html` | `components/content.html` | Change | Byline demo updated to 2.0; cells rule in the examples | F04, F27 |
| `components/navigation.html` | `components/navigation.html` | Change | Steps that are buttons, as the guide's rail uses them | F07, F22 |
| `components/feedback.html` | `components/feedback.html` | Keep | Shared template | F09, F14 |
| `components/overlays.html` | `components/overlays.html` | Change | The guide size of the dialog; a link to the guide page | F07 |
| `components/data.html` | `components/data.html` | Keep | Shared template | F09 |
| `brand/logo.html` | `brand/logo.html` | Change | Monogram headings unnumbered; the choice stays open | F15 |
| `brand/profile-links.html` | `brand/profile-links.html` | Change | Titled "Byline and profile links"; the rule covers every surface, the personal site included; website link required | F04, F05, F06 |

New pages:

| New page | Section | Why | Findings |
|---|---|---|---|
| `guidelines/writing.html` | Guidelines | Gives agents and you the copy rules that keep pages from reading as generated | F14, F15, F44 |
| `components/index.html` | Components | Every component A–Z with one line, as the section's first page | F09, F20 |
| `components/guide.html` | Components | The How it works guide: component, guideline and content format | F07, F08 |
| `404.html` | none | Recovery for mistyped and moved addresses | F30 |
| `llms.txt` | none | One generated file with the rules, classes, tokens, starters and the byline and guide requirements | F29 |

### Starters

| Starter | 2.0 |
|---|---|
| App (`starters/app.html`) | Byline 2.0; a finished "How the prototype works" guide about the Atlas sample; eyebrow gone |
| Dashboard (`starters/dashboard.html`) | Byline 2.0; a finished "How the demo works" guide; eyebrow gone |
| Landing (`starters/landing.html`) | Rebuilt as the base for your personal site: work linked, about, contact, byline; no aurora, no eyebrows, no "Hello, I'm"; no guide (F05, F16, F26) |
| Blank (`starters/blank.html`) | Header with the guide button, the byline and a guide whose chapters say what to write; listed in the docs (F05, F24) |

## 5. Checks

| Check | 2.0 |
|---|---|
| `check-docs` `REQUIRED` | Moves guarantees with their content and adds new ones; drops none. Theming's `theme-islands` and `override-tokens` move to `start/tokens.html`; Elevation's `surface-levels`, `shadows` and `layers-z-index` move to `guidelines/layout.html`; Licence keeps its ids at `brand/licence.html`. Getting started, which pins nothing today, gains `starters`, `add-vici-to-an-existing-page` and `work-offline`. New entries: `guidelines/writing.html`, `components/index.html` (`all-components`), `components/guide.html` (`title-pattern`, `chapters`, `copy-rules`, `content-format`, `behaviour`, `opening`, `presenting`). `brand/profile-links.html` keeps its seven ids and gains `every-surface` and `personal-site`. The component sections the guide depends on (`button`, `dialog`, `stepper`) are pinned too. |
| `check-docs`, new rules | The four redirect pages and the 404 page exist; no `vc-eyebrow` or `vc-bg-aurora` in docs pages or starters; no heading that starts with a number and a middle dot; none of the Writing guideline's banned words |
| `check-hex` | Unchanged rules and stricter self-test: it plants a round chapter marker and a round byline portrait and must catch both (9 planted violations today, 11 after) |
| `check-byline` (new) | Every built docs page, the 404 page, every starter and the Streamlit helper: one `.vc-byline` with "Built by" and "Victor Pflüger", the LinkedIn link and the website link from `profile.json`, both with `rel` containing `author`, the website link with an accessible name. A self-test plants pages missing each part. Prints `BYLINE OK`. |
| `check-guide` (new) | As in section 3. Prints `GUIDE OK`. |
| `check-tokens` | Adds the separation rules from section 1 for both themes |
| `check-render` | Adds the guide's behaviour, a structural trunk test (logo link, one h1 matching the document title, sections, local navigation, `aria-current` in header and sidebar, search) at 1280 and 375 px, search from disk, and the byline at 320 px |
| `build.mjs --check` | Also covers `llms.txt`, the search index, the redirect pages, the version in every place, and the token block of `DESIGN.md` (Phase 5) |

## 6. Open decisions

| Id | Decision | Recommendation |
|---|---|---|
| D1 | The One Thing | Recommended: adopt the sharpened sentence above |
| D2 | Scope | Recommended: Medium (section 7) |
| D3 | Remove `.vc-eyebrow`, `.vc-bg-aurora` and the aurora tokens in 2.0, or keep them deprecated until 3.0 | Recommended: remove now. Only your projects use them, and they keep a pinned 1.0.0 until they move |
| D4 | New values for the status and selection colours (touches non-negotiables 2 and 5) | Recommended: approve the separation targets now; you approve the final values from before and after swatches at the end of Phase 3 |
| D5 | When the guide opens by itself | Recommended: every new tab, not on reload, with `?guide=0` and `?guide=present` |
| D6 | Byline form | Recommended: keep the prototypes' form with the globe required; the name keeps linking to LinkedIn |
| D7 | Byline on the personal site | Recommended: the same byline, its globe linking to the site's home page, so one rule and one check cover everything |
| D8 | Static search in the docs | Recommended: yes; without it the trunk test can't pass |
| D9 | A generated `llms.txt` for agents | Recommended: yes |
| D10 | The 21 icons your prototypes need | Recommended: 2.1, after the prototypes move |
| D11 | Moved pages | Recommended: move them and leave redirect pages at the old addresses |
| D12 | The missing release tag | Recommended: create `v1.0.0` on GitHub today (Releases, Draft a new release, tag `v1.0.0` on `main` at `fdd868b`); this session can't push tags |
| D13 | The guide's content format | Recommended: HTML in the page, which works under a strict CSP and can be checked, with script events for computed figures |
| D14 | Writing as a new guideline page | Recommended: yes; it gives agents the rules that keep pages from reading as generated |

Approved by Victor on 19 November 2026: all fourteen as recommended, with scope Full (section 7). Full includes the 21 prototype icons, so D10's recommendation to wait for 2.1 no longer applies.

## 7. Scope options

All three include Phase 5: verification, `DESIGN.md`, the version bump, the changelog with migration, and the delivery ZIP.

| Option | Delivers | Definition of done |
|---|---|---|
| Small | Every P0 and P1 finding: the tag and generated pins, Getting started's five-minute path, a home page that shows a real page, byline 2.0 with its check, the guide (component, page, three starter guides, check), the colour separation, All components and search. Eyebrows and aurora leave the docs and starters, but the classes stay. | Partly. P0, P1 and severity 3–4 are fixed, but the duplicated navigation, mismatched titles and template patterns on other pages put the 2.0 checklist and the Jobs verdict at risk. Without D3 it is really 1.1.0. |
| Medium | Small, plus every P2: the new information architecture and navigation, Writing, retiring the eyebrow and aurora (D3), the cells rule, the 404 and redirect pages, copy buttons on every code block, the rebuilt landing starter, `llms.txt`, inline styles extracted, and the guide fixes that came out of Dispatch Lab. | Yes, all of it. |
| Full | Medium, plus every P3 and the extras: the 21 prototype icons, a German sample guide, and **impeccable** `polish` and `delight` passes on every page rather than on the reviewed ones. | Yes, with room to spare. Most likely to need a second chat. |

Recommended: Medium. It is the smallest option that meets your Definition of done. The icons are the main thing it leaves for 2.1.

## 8. Gates (unlazy)

**unlazy** turns the Definition of done into this ledger. Before Phase 3 it goes to `.unlazy/v2/GATES.md` (untracked), with its scripts in `.unlazy/v2/`, and is linted and approved there. The 2.0 checklist joins it before Phase 4. Nothing is reported done while a gate is unmet.

```markdown
# Gates: ViciDesign 2.0 definition of done

OWNS: src/**, scripts/**, README.md, CHANGELOG.md, package.json, PRODUCT.md, DESIGN.md, V2_PLAN.md, llms.txt, index.html, 404.html, dist/**, start/**, guidelines/**, components/**, brand/**, starters/**, integrations/**, assets/logo/**, assets/docs/**

Scope: Vici 2.0 and its website meet the brief's Definition of done and every rule of the 2.0 checklist.

- [ ] V0: this ledger states outcomes that can fail
  CHECK: node .unlazy/v2/lint.mjs .unlazy/v2/GATES.md
  EXPECT: LINT OK
  EVIDENCE: pending

- [ ] V1: every generated file matches its sources (build.mjs --check)
  CHECK: node scripts/build.mjs --check
  EXPECT: BUILD UP TO DATE
  EVIDENCE: pending

- [ ] V2: npm run check passes, including the new byline and guide checks
  CHECK: npm run check
  EXPECT: /^(?=[\s\S]*TOKENS OK)(?=[\s\S]*HEX OK)(?=[\s\S]*DOCS OK)(?=[\s\S]*BYLINE OK)(?=[\s\S]*GUIDE OK)(?=[\s\S]*INTEGRATIONS OK)/
  EVIDENCE: pending

- [ ] V3: check-hex is at least as strict as in 1.0.0
  CHECK: node .unlazy/v2/hex-strictness.mjs
  EXPECT: HEX AT LEAST AS STRICT AS 1.0.0
  EVIDENCE: pending

- [ ] V4: every page and starter renders cleanly in both themes and on phones
  CHECK: npm run check:render
  EXPECT: RENDER OK
  EVIDENCE: pending

- [ ] V5: the byline check fails on a page without the byline or either link
  CHECK: node scripts/check-byline.mjs --self-test
  EXPECT: BYLINE SELF-TEST OK
  EVIDENCE: pending

- [ ] V6: the How it works guide check fails on a starter without a guide or with a broken one
  CHECK: node scripts/check-guide.mjs --self-test
  EXPECT: GUIDE SELF-TEST OK
  EVIDENCE: pending

- [ ] V7: every P0 and P1 finding, and every ux-heuristics severity 3 or 4 finding, is fixed or deferred with Victor's approval
  CHECK: node .unlazy/v2/findings-status.mjs V2_PLAN.md
  EXPECT: ALL P0 AND P1 CLOSED
  EVIDENCE: pending

- [ ] V8: the Design Health Score beats its baseline on home, Getting started, Hexagon and Actions
  CHECK: node .unlazy/v2/scores.mjs V2_PLAN.md
  EXPECT: SCORES BEAT BASELINE ON EVERY REVIEWED PAGE
  EVIDENCE: pending

- [ ] V9: the steve-jobs-design-review verdict for home and Getting started is INSANELY GREAT
  EVIDENCE: pending

- [ ] V10: the trunk test passes on every page type at 1280 and 375 px
  CHECK: node .unlazy/v2/trunk.mjs
  EXPECT: TRUNK OK ON EVERY PAGE TYPE
  EVIDENCE: pending

- [ ] V11: the docs and all four starters pass every automated rule of the 2.0 checklist
  CHECK: node scripts/check-v2.mjs
  EXPECT: CHECKLIST OK
  EVIDENCE: pending

- [ ] V12: the judgement rules of the 2.0 checklist are reviewed on every page type and starter, with no open violations
  EVIDENCE: pending

- [ ] V13: a fresh clone rebuilt from sources matches the delivered generated files, so none was edited by hand
  CHECK: node .unlazy/v2/fresh-build.mjs
  EXPECT: FRESH BUILD MATCHES
  EVIDENCE: pending

- [ ] V14: all eight non-negotiables hold, with evidence for each
  EVIDENCE: pending

- [ ] V15: version 2.0.0 is consistent everywhere and the changelog has a 2.0.0 entry with migration notes
  CHECK: node .unlazy/v2/release.mjs
  EXPECT: RELEASE 2.0.0 CONSISTENT
  EVIDENCE: pending

- [ ] V16: DESIGN.md exists with a token block generated from tokens.json
  CHECK: node .unlazy/v2/design-md.mjs
  EXPECT: DESIGN.md OK
  EVIDENCE: pending
```

## 9. Status

| Phase | State |
|---|---|
| 1. Diagnose | Done, 19 November 2026 (Appendix A) |
| 2. Plan | Done; approved 19 November 2026 (scope Full) |
| 3. System | In progress: tokens and palette, components and script done; icons and the rules on the Guidelines and Brand pages next |
| 4. Website | Not started |
| 5. Verify and deliver | Not started |

Phase 3 so far (19 November 2026). Every step ended with `node scripts/build.mjs` and a green `npm run check`.

| Step | Done |
|---|---|
| Gates | The Definition of done is a live ledger in `.unlazy/v2/GATES.md` (untracked), linted, with oracle scripts beside it |
| Tokens and palette | Six theme references changed (no palette change); aurora tokens retired; `check-tokens` enforces 16 separations, including danger against success under protan and deutan vision. The 1.0 values fail it with 12 violations |
| Retirements (D3) | `.vc-eyebrow` and `.vc-bg-aurora` removed from the CSS; 45 eyebrows removed or turned into captions across 29 docs pages and starters |
| Guide | `vc-guide` CSS and behaviour, interactive stepper steps, first guides in the app, dashboard and blank starters, `check-guide` (self-test 8 of 8) and a browser test in `check:render` (20 assertions per starter) |
| Byline | One source in `src/brand/profile.json`; the 2.0 byline with the website link on all 26 docs pages and four starters and in the Streamlit helper; `check-byline` (self-test 5 of 5) |
| Version | `dist/vici.js` takes its version from `package.json` |
| check-hex | Stricter: self-test 11 of 11 (9 before), 34 would-be-round components (31 before) |

Next, in a new chat: your approval of `v2-status-colours.html` (D4), the 21 icons, and the rules on the Guidelines and Brand pages (Writing, Principles, Colour, Hexagon, Accessibility, the How it works guide page, and the Byline and profile links rule, which closes F06). Then the 2.0 checklist goes into this file and Phase 3 closes.

P0 and P1 findings, which the Definition of done requires closed:

| ID | Severity | Status | Fixed in |
|---|---|---|---|
| F01 | P0 | Open | |
| F02 | P1 | Open | |
| F03 | P1 | Open | |
| F04 | P1 | Fixed | `src/brand/profile.json`, `@byline` widget in `scripts/lib/docs.mjs`, `src/docs/layout.html`, starters, Streamlit helper in `scripts/build.mjs` |
| F05 | P1 | Fixed | All four starters carry the byline; `scripts/check-byline.mjs` in `npm run check` |
| F06 | P1 | Open | |
| F07 | P1 | In progress | `vc-guide` in `src/css/components/overlays.css` and `src/js/vici.js`; guides in three starters; `scripts/check-guide.mjs`, `scripts/check-guide-render.mjs`. The guideline page follows with the rules |
| F08 | P1 | In progress | The presenting chapter is required by `check-guide`; the guideline page follows |
| F09 | P1 | Open | |
| F10 | P1 | Open | |
| F11 | P1 | Done, awaiting approval | `--vc-accent-text` light to merlot 800; separation rule in `scripts/check-tokens.mjs` |
| F12 | P1 | Done, awaiting approval | Light success 900, dark success 100 and danger 500; protan and deutan rule in `check-tokens` |
| F13 | P1 | Done, awaiting approval | Dark danger solid coral 500, danger text coral 400 |

## Appendix A: Phase 1 diagnosis

Everything here was measured on `main` at `fdd868b` (24 October 2026). Screenshot names (`shot:`) refer to the renders in `v2-review-screenshots.zip`, made with Playwright and Chrome at 1280 and 375 px. `dl:` marks a file in Dispatch Lab's `gh-pages` branch at `c86994b`.

### A1 Baseline

| Command | Result |
|---|---|
| `node scripts/build.mjs --check` | 82 generated files match their sources. BUILD UP TO DATE. Exit 0. |
| `npm run check` | TOKENS OK (178 contrast pairs, weakest at 1.20 times its minimum), BUILD UP TO DATE, HEX OK (self-test caught 9 of 9 planted violations; 19 CSS, 102 SVG and 61 HTML files; 31 of 31 would-be-round components), FONTS OK, DOCS OK (30 pages, 16 required topics, 1,405 links), LOGO OK, INTEGRATIONS OK. Exit 0. |
| `npm run check:render` | RENDER OK: 120 renders (30 pages at 1280 px light and dark, 375 and 320 px light), no console errors, no failed requests, no phone overflow, 2,068 hexagon parts with a polygon clip-path. Exit 0. Playwright 1.63 with Chrome. |
| `git ls-remote --tags` | No tags. jsDelivr answers `@v1.0.0` with a client error and serves `@main`. |

### A2 steve-jobs-design-review

#### Design review: Vici documentation site 1.0.0, experienced cold

**Verdict:** NOT DONE (score 4/10)

**The One Thing:** the site's own promise, from its home page: "Vici is the design system behind Victor Pflüger's prototypes, websites and data products." Your working version: someone new understands what Vici is within a minute and has a working, on-brand page within five.

**Keeps its promise?** No. The home page names prototypes, websites and data products but shows none and links to none, and the production path on Getting started ends in a stylesheet that never loads (F01, F03).

**Steps to value:** six, with a dead end. (1) Home, then Get started. (2) Choose one of three sources. (3) Select and copy the pinned CDN lines by hand, since they have no copy button. (4) They fail: the `v1.0.0` tag doesn't exist. (5) Assemble the blank page from section 2, whose paths point at a local copy instead. (6) Add classes. The target is three: open Getting started, copy a starter, open it.

**Cut list:**

- Home: the aurora wash, the eight tiles that look like links and aren't, the principle grid that repeats Principles, the section cards that repeat the header, the palette band and the Logo action (F16 to F19).
- The eyebrow on every page and in three starters (F14).
- Numbered headings where nothing is a sequence (F15).
- Either the header's sections or the full-site sidebar: keep the header, and let the sidebar show one section (F21).
- The reference half of Getting started, from the onboarding path (F28).
- The separate Starters, Theming and Elevation pages, merged into their natural homes.
- The landing starter's template opening (F26).

**Fix list:**

1. Getting started recommends pinning `@v1.0.0` for production, and that address returns an error because the tag was never created. Tag it now, generate every pin from `package.json`, and tag before release (F01).
2. A newcomer can't reach a working page in under six steps. Lead Getting started with "copy a starter": one complete page with the byline and guide, behind one copy button (F02).
3. The home page describes Vici and never shows it. Lead with a slice of a real page and the two working lines, and link the live prototypes (F03).
4. The signature is incomplete: no website link anywhere in the docs or starters, no byline on two starters, and a rule that exempts your own site. Byline 2.0 everywhere, checked (F04 to F06).
5. Prototypes explain themselves only when you build a guide by hand, and none tells a partner how to present. The `vc-guide` standard, with a presenting chapter, in three starters, checked (F07, F08).
6. To find a component you must guess its category, and there is no search. All components A–Z, plus search (F09, F10).
7. The page templates read as generated: eyebrows, an aurora hero, icon grids, numbered headings. Remove them and write the rules down in Writing (F14 to F16, F27).
8. Danger looks like merlot, and the status colours share one lightness. Separate them (F11 to F13).

**Back of the fence:**

- No 404 page, while 2.0 moves four addresses (F30).
- The blank starter exists and is never mentioned; the Starters page says "three" (F24).
- Install snippets without copy buttons (F25).
- The "120°" label running into the hexagon's outline on the Hexagon page (F37).
- `lang="en"` on a British English site (F38).
- The docs load the 232 KB unminified stylesheet they tell everyone else not to use (F39).
- The first snippet puts the initials "VP" into a newcomer's page (F40).

**Next review:** after Phase 4, before the `v2.0.0` tag: home, Getting started and the app starter's guide, live at 1280 and 375 px in both themes, with the guide judged by someone who has to present the prototype.

#### Quick diagnostic

| Question | Result | Evidence |
|---|---|---|
| Can you state the One Thing in one sentence? | Fail | The site serves showcase, reference and onboarding with equal weight: four equal sections and three hero actions, one of them Logo |
| Does a new user reach core value in three steps or fewer? | Fail | Six steps and a dead end (F01, F02) |
| Did the reviewer experience it cold? | Pass | Rendered at 1280 and 375 px in both themes before reading any page source |
| Is there a working demo on the real device? | Pass | Every component demo is live; the starters run from disk and on a phone |
| Was anything removed this cycle? | Pass | "Left out on purpose" refuses five components; two logo concepts are archived |
| Do error, empty and edge states match hero quality? | Fail | Dead pinned link, no 404 page, no troubleshooting, a hidden starter, two starters without the byline |
| Would the team proudly sign it? | Fail | The signature itself is incomplete, and the page templates are generic |

Three of seven rows pass, which the skill maps to 4/10: not done, back to demos.

### A3 ux-heuristics

Score: 4/10. Of the ten quick-diagnostic rows, four fail: search (major), helpful errors (the pinned link, catastrophic), clear navigation (partly) and "huh?" moments (the Logo action, "Actions" for buttons, tiles that aren't links, three starters out of four). One catastrophic issue puts it in the 3–5 band.

#### Trunk test

One page of each type, dropped onto cold. "Yes" means answered without interaction.

| Page type (page tested) | Site | Page | Sections | Options here | You are here | Search | At 1280 px | At 375 px |
|---|---|---|---|---|---|---|---|---|
| Home (`index.html`) | Yes: logo and version | The headline is a tagline, not a page name | Yes, header | Hero actions and section cards | Nothing marked | No | Partial | Partial: sections only through the menu |
| Start (Getting started) | Yes | Yes, matches the sidebar | Yes | All 26 pages in the sidebar | Yes, four times | No | Partial | Partial: only the eyebrow says where |
| Guidelines (Hexagon) | Yes | "Hexagon geometry", from a link that said "Hexagon" | Yes | Yes | Yes | No | Partial | Partial |
| Components (Actions) | Yes | "Actions", from a link that said "Components", when the visitor wanted Button | Yes | Category names; component names only in the contents column from 1280 px | Yes | No | Fail | Fail |
| Brand (Profile links) | Yes | Yes | Yes | Yes | Yes | No | Partial | Partial |

Pass rule for 2.0: at 1280 px all six questions are answered without interaction; at 375 px site, page and location are answered without interaction, and sections, options and search are one tap away.

#### Heuristic evaluation

Navigation and page templates, rated on the skill's 0–4 scale.

| Issue | Heuristic | Severity | Finding |
|---|---|---|---|
| The pinned CDN link in the install path fails | Error prevention; recovery from errors | 4 | F01 |
| Component names are hidden behind category names | Recognition rather than recall; match with the real world | 3 | F09 |
| No search anywhere | Flexibility and efficiency; help and documentation | 3 | F10 |
| Getting started puts choices before any result and mixes tutorial with reference | Aesthetic and minimalist design | 3 | F02 |
| The guide gives a presenting partner nothing to work with | Help and documentation | 3 | F08 |
| Section links open pages with other names; sidebar labels differ from titles | Consistency and standards | 2 | F20 |
| Full sidebar plus header sections; position shown four times | Aesthetic and minimalist design | 2 | F21 |
| No "On this page" below 1280 px | Recognition rather than recall | 2 | F22 |
| On phones, only the eyebrow tells you where you are | Visibility of system status | 2 | F23 |
| Home tiles look like links and aren't | Consistency and standards | 2 | F17 |
| The Logo action competes with Get started | Aesthetic and minimalist design | 2 | F19 |
| The blank starter is never mentioned | Consistency and standards | 2 | F24 |
| Install snippets can't be copied with a button | Flexibility and efficiency | 2 | F25 |
| No 404 page | Recovery from errors | 2 | F30 |
| The guide opens only on a browser's first visit | Visibility of system status | 2 | F35 |
| The pager crosses sections silently | Consistency and standards | 1 | F41 |
| Licence sits among the onboarding pages | Match with the real world | 1 | F43 |
| The headline is clever before it is clear | Match with the real world | 1 | F44 |
| The guide's button has a tooltip repeating its label | Aesthetic and minimalist design | 1 | F45 |

### A4 impeccable critique and audit

⚠️ DEGRADED: single-context (no sub-agents in this session, and impeccable's detector didn't run because its launcher isn't executable here)

Both assessments ran in one context, A before B. Assessment B used the evidence available instead of the detector: `npm run check:render` (above) and screenshots at 1280 and 375 px in both themes. The snapshot was not saved: impeccable's storage helper needs the launcher, and Phase 1 allows no new files besides `PRODUCT.md`. The critique's questions are asked with the approval request at the end of Phase 2. Inter is on impeccable's overused-font list; the brief makes it a deliberate choice, so that finding is set aside.

#### Critique

Nielsen's ten heuristics, 0–4 each. The Dispatch Lab guide is scored as the reference for section 3.

| Page | 1 Status | 2 Real world | 3 Control | 4 Consistency | 5 Error prevention | 6 Recognition | 7 Efficiency | 8 Minimalism | 9 Recovery | 10 Help | Design Health Score | Band |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Home | 3 | 3 | 3 | 2 | 2 | 2 | 2 | 2 | 3 | 2 | 24/40 | Acceptable |
| Getting started | 3 | 3 | 3 | 2 | 1 | 2 | 2 | 2 | 1 | 3 | 22/40 | Acceptable |
| Hexagon guideline | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 29/40 | Good |
| Actions | 3 | 2 | 3 | 2 | 3 | 2 | 3 | 3 | 2 | 3 | 26/40 | Acceptable |
| Dispatch Lab guide (reference) | 4 | 3 | 4 | 3 | 3 | 3 | 2 | 3 | 3 | 2 | 30/40 | Good |

Design specificity: half authored. The system's parts could belong to no other product: flat-top geometry down to the icons and the password mask, the merlot ground, the byline, and token tables generated from the source. The pages around them could belong to any product: an uppercase eyebrow over every title, a pastel aurora behind a giant headline, an icon-in-a-shape feature grid, section cards that repeat the header. Covering the logo, the home page reads like a SaaS template in Vici's colours; the Hexagon page does not.

What works: on the Hexagon page, the anatomy diagram, the "usually a circle / in Vici" table and the explanation of why `clip-path` can't take an outline teach the system's one big idea precisely. The demos are live, with exact HTML and a copy button that confirms. And the build refuses a circle, a weak contrast pair or a stale file.

Priority issues, in order: F01 (P0), then F02, F03, F09 and F10 (P1), then F14 (P2). Details are in A7. Minor observations: F37, F38, F39, F40 and F44.

Questions to consider: if an agent is the most frequent newcomer, what is the shortest text that gets it to a correct page? What would the home page look like if it could only show things built with Vici? Which of the four navigation systems would you miss?

#### Audit

| Page | Accessibility | Performance | Theming | Responsive | Implementation integrity | Audit Health Score |
|---|---|---|---|---|---|---|
| Home | 3 | 3 | 3 | 3 | 1 | 13/20 |
| Getting started | 3 | 3 | 4 | 3 | 1 | 14/20 |
| Hexagon guideline | 3 | 3 | 3 | 3 | 3 | 15/20 |
| Actions | 3 | 3 | 4 | 3 | 3 | 16/20 |

Implementation integrity fails on home and Getting started and passes on Hexagon and Actions. Home stacks four template patterns (F14, F16, F17, F27) on 127 lines that also need five inline styles. Getting started's recommended production snippet doesn't work (F01).

Accessibility is good throughout (skip link, landmarks, one h1, labelled icon buttons, tooltips in the top layer, AA contrast checked by the build); it loses a point for `lang="en"` (F38) and the guide's double announcements (F34). Performance loses a point for the unminified stylesheet (F39). Theming loses a point on home and Hexagon for inline colour styles in the sources (F36). Responsive passes the 320 px reflow test everywhere; it loses a point for the missing in-page contents below 1280 px (F22) and the tiles that push the home page's content two screens down on a phone.

#### Personas

- Jordan, first-timer: clicks "Logo" or a hexagon tile that does nothing; on Getting started, picks the CDN, pins `@v1.0.0` as advised and gets an unstyled page.
- Alex, power user: looks for "tooltip", finds no search and no component list, and guesses between Feedback and Overlays.
- Sam, keyboard and screen reader: the docs work well; in Dispatch Lab's guide each chapter is read twice.
- Cold-start agent (from `PRODUCT.md`): fetches Getting started, copies the pinned snippet, produces a page with no styles, no byline and no guide, and nothing it read told it a byline was required.
- Presenting partner (from `PRODUCT.md`): opens a prototype on a laptop that has seen it before, so no guide appears; reopens it and finds no order, no script and no timing.

### A5 Hypotheses

| Hypothesis | Evidence | Verdict | Decision |
|---|---|---|---|
| The uppercase eyebrow above every page title | On 26 of 26 pages (36 in pages, 7 in starters); documented as a text style (`typography.html:53`); on docs pages it repeats the section the header and sidebar already mark; impeccable's craft floor bans it outright | Template tell. The hexagon bullet is the only Vici part, and it doesn't make the pattern Vici's | Remove from docs and starters; retire the class (D3); Writing bans it |
| Middle-dot labels and numbered "1 ·" headings | 15 numbered headings on three pages; dots stapling fragments into taglines ("Personal design system · v1.0.0"); dots in data captions, modifier lists and page titles | Tell for numbered headings and stapled taglines; identity-neutral in captions, lists and titles | Plain headings; ordered lists or the stepper for real steps; dots only in captions and titles |
| The gradient aurora hero on the home page | Three blurred radial gradients (`utilities.css:94-100`) behind a display headline, repeated in the landing starter | Tell in its execution. Pastel atmosphere is Vici identity under principle 2; blurred blobs are the generic mesh-gradient hero. Vici's own signature is geometry | Remove; atmosphere from flat pastel grounds or the honeycomb used once for real content |
| How many routes lead to the same content | Header (4 sections), sidebar (all 26 pages), contents column, pager, home cards and hero actions; your position shown four times | Identity-neutral shell, telling duplication. Header, sidebar, contents and pager are the docs pattern readers know; showing all four at full scope on one screen is what makes the site read as assembled | Header for sections, sidebar for the current section, contents from 1280 px and inline below, pager kept; home cards cut |

### A6 Dispatch Lab's guide

Reviewed from your screenshot and from the code on `gh-pages` at `c86994b`: `js/ui/guide.js`, `js/guide-content.js`, `js/main.js`, `index.html` and `css/guide.css`, with **impeccable** `critique` (30/40 in A4) and **ux-heuristics**.

What to keep in the standard:

- a large dialog with a chapter rail of numbered hexagons that you can jump around in;
- one heading, one lead and one figure or table per chapter, so no chapter overloads the reader;
- headings that make a claim in the product's own words ("Get 36 trains through a busy rail hub, on time");
- every figure computed from the prototype's data, so the guide can't go stale;
- Back and Next with "1 of 7", focus on Next when it opens and on each new heading, Escape to close, full screen on a phone;
- *How it works* in the header to reopen it;
- a last button that leads into doing something ("Watch the baseline").

What a partner who has to present it is missing:

- No chapter on presenting: no path through the prototype, no order, nothing to say and no idea how long it takes (F08). The seven chapters explain the challenge and the page, not the meeting.
- It opens only on a browser's first visit, so the partner's second look, or a viewer on a laptop that has seen it, gets nothing by itself (F35).
- It can't be opened at a particular chapter from a link, so a partner can't send "start at the results".
- The guide lacks a standard: it is 168 lines of app code plus a modal module, written for this prototype only, so the other four use shorter intro windows (F07).

What to fix on the way into Vici: the chapter eyebrow that repeats the rail and the count (F33), the live region that makes screen readers read every chapter twice (F34), and the tooltip that repeats the header button's label (F45).

### A7 Findings

Sorted by severity. P0–P3 is impeccable's scale; where a finding came from ux-heuristics, its 0–4 rating is in brackets (4 maps to P0, 3 to P1, 2 to P2, 1 to P3).

| ID | Page or area | Finding | Evidence | Skill | Severity | Fix direction | Non-negotiable |
|---|---|---|---|---|---|---|---|
| F01 | Getting started, README, blank starter | The pinned CDN snippet (`@v1.0.0`) fails because the repository has no `v1.0.0` tag; anyone following "pin a release tag for production" gets an unstyled page | `src/docs/pages/start/getting-started.html:19-21`, `README.md:24`, `src/starters/blank.html:9-10`; git: ls-remote lists no tags; live: jsDelivr `@v1.0.0` client error, `@main` serves the CSS | steve-jobs-design-review, ux-heuristics, impeccable audit | P0 (UX 4) | Tag `v1.0.0` now; generate every pin from `package.json`; tag `v2.0.0` before the docs go live | No |
| F02 | Getting started | Six steps and a dead end to a working page: three sources to choose from before any result, a blank page whose local paths differ from the CDN lines above it, and no copy button on these snippets | `src/docs/pages/start/getting-started.html:15-66`; shot:start_getting-started-light-1280.png | steve-jobs-design-review, ux-heuristics | P1 (UX 3) | Lead with "copy a starter" (byline and guide included), then the two lines; choices and reference below | No |
| F03 | Home | The home page never shows a page built with Vici: tiles, a principle grid, section cards and a palette band, while the starters are two clicks away and the prototypes aren't linked at all | `src/docs/pages/index.html:5-127`; shot:index-light-1280-full.png; shot:starters_app-light-1280.png | steve-jobs-design-review, impeccable critique | P1 | Lead with a slice of a real page and the working install; link the live prototypes that run on Vici; cut the decoration | No |
| F04 | Byline in docs and starters | The byline links only to LinkedIn; no docs page or starter links to the website, though non-negotiable 8 requires both with `rel="author"`, and the prototypes already carry the globe | `src/docs/layout.html:63-71`, `src/starters/app.html:201-206`, `src/starters/dashboard.html:128-133` | steve-jobs-design-review, impeccable audit | P1 | Byline 2.0 with both links from one source | Yes (8) |
| F05 | Starters | The landing and blank starters have no byline, and no check would notice | `src/starters/blank.html:15-30`, `src/starters/landing.html:58-61`, `scripts/check-docs.mjs:27-44` | impeccable audit | P1 | Byline in all four starters; `check-byline` in `npm run check` | Yes (8) |
| F06 | Profile links rule | The rule exempts the personal site ("needs no byline"), against non-negotiable 8 | `src/docs/pages/brand/profile-links.html:107`, `src/docs/pages/brand/profile-links.html:84` | steve-jobs-design-review | P1 | Every prototype, demo and website, the personal site included | Yes (8) |
| F07 | How it works | Vici has no guide component, guideline, content format or check; Dispatch Lab hand-builds its own and the other four prototypes use shorter intro windows | `dl:js/ui/guide.js:1-168`, `dl:js/main.js:261` | impeccable critique, ux-heuristics | P1 | `vc-guide` on dialog and stepper, HTML format, guideline page, three starter guides, `check-guide` | No |
| F08 | Dispatch Lab guide | No chapter on presenting: no path, no order, nothing to say, no timing | `dl:js/guide-content.js:199-367` | ux-heuristics, impeccable critique | P1 (UX 3) | Required last chapter with 3–7 timed steps and a line to say for each | No |
| F09 | Components navigation | Component names appear nowhere in the navigation; the sidebar lists seven categories, and the contents column that names them shows only from 1280 px | `scripts/lib/docs.mjs:684-693`, `src/docs/docs.css:532`; shot:components_actions-light-1280.png | ux-heuristics | P1 (UX 3) | All components A–Z as the section's first page; component names in search | No |
| F10 | Whole site | No search; the trunk test's sixth question fails on every page type, and finding a class means knowing which page holds it | `src/docs/layout.html:21-41`, `src/docs/docs.js:1` | ux-heuristics | P1 (UX 3) | Static search over a generated index; no dependency; works from disk | No |
| F11 | Tokens, light theme | `--vc-accent-text` (#8f2f42) and `--vc-danger-solid` (#954238) are almost the same colour (ΔOK 0.051), so brand text reads as an error colour | `src/tokens/tokens.json:932`, `src/tokens/tokens.json:995` | impeccable audit | P1 | Move danger away from merlot; separation rule in `check-tokens` | Yes (2, 5) |
| F12 | Tokens, both themes | The status solids share one lightness (light: danger 0.486, success 0.485, info 0.484; dark: danger, success and warning about 0.858), so viewers with colour-vision deficiency can't tell them apart by colour | `src/tokens/tokens.json:950-995`, `src/tokens/tokens.json:1260-1305` | impeccable audit | P1 | Spread the status tones in lightness; rule in `check-tokens` | Yes (2, 5) |
| F13 | Tokens, dark theme | The primary action (`--vc-accent` #fcd2d5) and `--vc-danger-solid` (#fcc0b4) are almost the same colour (ΔOK 0.051): the primary button looks like a danger fill | `src/tokens/tokens.json:1221`, `src/tokens/tokens.json:1305` | impeccable audit | P1 | Same change as F11 in the dark theme | Yes (2, 5) |
| F14 | Every page, three starters | An uppercase eyebrow sits above every page title and is documented as a text style; on docs pages it repeats the section the header and sidebar mark; impeccable's craft floor bans it | `src/docs/pages/start/getting-started.html:10`, `src/css/utilities.css:29-48`, `src/docs/pages/guidelines/typography.html:53`; shot:start_getting-started-light-1280.png | impeccable critique, ux-heuristics | P2 | Remove from docs and starters; retire `.vc-eyebrow` (D3) | No |
| F15 | Getting started, Principles, Logo | Fifteen headings numbered "1 ·" to "5 ·", ranking things that have no order; on Getting started, sections 4 and 5 aren't steps | `src/docs/pages/start/getting-started.html:15`, `src/docs/pages/guidelines/principles.html:40-48`, `src/docs/pages/brand/logo.html:63-103` | impeccable critique | P2 | Plain headings; ordered list or stepper only for real steps | No |
| F16 | Home, landing starter | The aurora hero is the generic mesh-gradient hero, not Vici's geometry | `src/docs/pages/index.html:5`, `src/starters/landing.html:58`, `src/css/utilities.css:94-100`; shot:index-dark-1280.png | impeccable critique, steve-jobs-design-review | P2 | Cut; retire `.vc-bg-aurora` and its tokens (D3) | Yes (2) |
| F17 | Home | Eight hexagon tiles look like navigation but aren't links | `src/docs/pages/index.html:18-29`; shot:index-light-1280.png | ux-heuristics | P2 (UX 2) | Cut them; the slice of a real page takes their place in the opening | No |
| F18 | Home | The principle grid repeats Principles, the section cards repeat the header, the palette band is decoration | `src/docs/pages/index.html:34-103`, `src/docs/pages/index.html:123-125` | steve-jobs-design-review | P2 | Cut all three | No |
| F19 | Home | Three hero actions, one of them "Logo", which sends a newcomer to brand assets | `src/docs/pages/index.html:12-16` | steve-jobs-design-review, ux-heuristics | P2 (UX 2) | One primary and one secondary action | No |
| F20 | Navigation | Section links open pages with other names ("Components" opens "Actions") and five sidebar labels differ from their page titles | `scripts/lib/docs.mjs:695-699`, `src/docs/pages/guidelines/hexagon.html:2-3`, `src/docs/pages/start/tokens.html:2-3` | ux-heuristics | P2 (UX 2) | Section first pages whose titles match; one name per page | No |
| F21 | Navigation | The desktop sidebar lists all 26 pages while the header repeats the sections; your position is shown four times | `scripts/lib/docs.mjs:684-699`; shot:start_getting-started-light-1280.png | ux-heuristics, impeccable critique | P2 (UX 2) | Header for sections, sidebar for the current section | No |
| F22 | Navigation | "On this page" appears only from 1280 px, so Forms (12 sections) and Content (10) have no contents on laptops, tablets and phones | `src/docs/docs.css:523-532` | ux-heuristics | P2 (UX 2) | Right column from 1280 px, short list under the lead below | No |
| F23 | Navigation on phones | Below 1024 px the sections and sidebar hide behind the menu; only the eyebrow says where you are, and F14 removes it | shot:start_getting-started-light-375.png; `src/docs/docs.css:64` | ux-heuristics | P2 (UX 2) | Menu button labelled with the current section | No |
| F24 | Starters | The Starters page says "Three complete pages" and the blank starter is never mentioned | `src/docs/pages/start/starters.html:11`, `src/docs/pages/start/getting-started.html:66` | ux-heuristics | P2 (UX 2) | Show all four | No |
| F25 | Code blocks | Install and integration snippets have no copy button | `src/docs/pages/start/getting-started.html:20-21`, `src/docs/docs.js:31-50` | ux-heuristics | P2 (UX 2) | The build gives every code block a copy button | No |
| F26 | Landing starter | It repeats the home template (aurora, eyebrows, "Hello, I'm Victor.", topic tiles), and your personal site will be rebuilt on it | `src/starters/landing.html:58-61`; shot:starters_landing-light-1280.png | impeccable critique | P2 | Rebuild as the base for the personal site | No |
| F27 | Cells | `.vc-cell` is documented "for feature lists and cards", and home and Starters use icon-in-hexagon card grids: the icon-card template in Vici's shape | `src/docs/pages/guidelines/hexagon.html:111-112`, `src/docs/pages/index.html:39-63`, `src/docs/pages/start/starters.html:17` | impeccable critique | P2 | Cells carry meaning; no decorative icon grids | No |
| F28 | Getting started | Reference material fills the second half of the onboarding page, which is 5,227 px long at 1280 px | `src/docs/pages/start/getting-started.html:82-120` | steve-jobs-design-review | P2 | Keep the page to the five-minute path; reference to the end or README | No |
| F29 | Agents | No digest for agents: they must read 26 pages of demos to collect classes, tokens and rules, and nothing says a page needs a byline and a guide | `src/docs/pages/start/tokens.html:34`, `scripts/lib/docs.mjs:626-645` | steve-jobs-design-review | P2 | Generate `llms.txt` with the build | No |
| F30 | 404 and moved pages | No 404 page; a mistyped or moved address ends on GitHub's default page, and 2.0 moves four | `scripts/lib/docs.mjs:729-745` | steve-jobs-design-review | P2 | 404 page with search; redirect pages | No |
| F31 | Tokens, light theme | `--vc-surface-selected` (#ffe5e7) and `--vc-danger-bg` (#ffe8e3) are nearly identical (ΔOK 0.011): a selected row looks like an error row | `src/tokens/tokens.json:872`, `src/tokens/tokens.json:986` | impeccable audit | P2 | Separate them; add the pair to the rule | Yes (2) |
| F32 | Checks | `REQUIRED` pins no component page and no Getting started section; nothing checks for a byline, a guide or status separation | `scripts/check-docs.mjs:27-44`, `scripts/check-tokens.mjs:1` | impeccable audit | P2 | Extend `REQUIRED`; add `check-byline` and `check-guide`; extend `check-tokens` | Yes (8) |
| F33 | Dispatch Lab guide | The chapter eyebrow "Chapter 1 of 7 · The challenge" repeats the rail and the footer count | `dl:js/ui/guide.js:136` | impeccable critique | P2 | Position in the rail and footer only | No |
| F34 | Dispatch Lab guide | The whole chapter is a live region while focus also moves to its heading, so screen readers read each chapter twice | `dl:js/ui/guide.js:56`, `dl:js/ui/guide.js:151` | impeccable audit | P2 | Move focus only | No |
| F35 | Dispatch Lab guide | It opens only on a browser's first visit | `dl:js/ui/guide.js:14-22`, `dl:js/main.js:261` | ux-heuristics | P2 (UX 2) | Every new tab; `?guide=0` and `?guide=present` | No |
| F36 | Docs sources | 148 inline `style` attributes: layout values the docs need and Vici doesn't provide | `src/docs/pages/index.html:19`, `src/docs/pages/index.html:38`, `src/docs/pages/guidelines/hexagon.html:31` | impeccable audit | P2 | `extract` the repeated ones into utilities or docs scaffolding | No |
| F37 | Hexagon guideline | The "120°" label overlaps the hexagon's outline in the anatomy diagram | `src/docs/pages/guidelines/hexagon.html:25`; shot:guidelines_hexagon-light-1280.png | impeccable audit | P3 | Move the label outside the shape | No |
| F38 | Whole site | `lang="en"` on a site in British English | `src/docs/layout.html:2` | impeccable audit | P3 | `lang="en-GB"`; `lang="de"` for German prototypes | No |
| F39 | Whole site | The docs load the 232 KB unminified stylesheet instead of `vici.min.css` | `src/docs/layout.html:13` | impeccable audit | P3 | Load `vici.min.css` | No |
| F40 | Home | The first snippet puts the initials "VP" into a newcomer's page | `src/docs/pages/index.html:120` | steve-jobs-design-review | P3 | Show a button and the byline instead | No |
| F41 | Navigation | The pager crosses sections without saying so | `scripts/lib/docs.mjs:701-706` | ux-heuristics | P3 (UX 1) | Name the section when crossing | No |
| F42 | Version | 1.0.0 is typed by hand in the script, README and Getting started | `src/js/vici.js:753`, `README.md:24`, `src/docs/pages/start/getting-started.html:19` | check | P3 | Generate from `package.json` | No |
| F43 | Start | Licence sits among the onboarding pages | `src/docs/pages/start/licence.html:3-4` | ux-heuristics | P3 (UX 1) | Move to Brand; footer link stays | No |
| F44 | Home | "Built in cells, not circles." is clever before it is clear; the lead does the explaining | `src/docs/pages/index.html:10-11` | ux-heuristics | P3 (UX 1) | Keep the line; open the lead with what Vici is | No |
| F45 | Dispatch Lab guide | The header button shows "How it works" and has a tooltip saying the same | `dl:index.html:47-48` | ux-heuristics | P3 (UX 1) | Tooltip only when the label is hidden | No |
