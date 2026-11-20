# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Only Victor Pflüger and the AI agents working for him build with Vici (confirmed November 2026). Nobody else builds pages on it.

- Victor, while building prototypes, demos, dashboards and websites. He often returns to Vici after weeks on other work.
- AI agents (Claude) building with Vici for Victor. Every session starts cold, so they need exact tokens, class names, rules and copyable code they can use without interpretation.
- Colleagues, partners and other visitors, who don't build with Vici but judge Victor's work through the documentation site and through the prototypes. Partners also present Victor's prototypes and need to know how.

## Product Purpose

Vici is Victor's personal design system: one stylesheet, an optional script, design tokens, icons, starter pages and generated themes for Streamlit, Power BI, Python and Tailwind. It makes his prototypes, demos, dashboards and websites look and behave as one family, and makes each of them visibly his.

The documentation site is both the reference for building with Vici and a showcase of Victor's work.

Working definition of success, under review in V2_PLAN.md: someone new understands what Vici is within a minute and has a working, on-brand page within five.

## Positioning

Vici replaces every circle with a flat-top hexagon ("cells, not circles") on a deep merlot base (`#250010`) with pastel families that carry meaning and atmosphere. It is a one-person system: every surface built with it names Victor as its builder, and every prototype, demo and challenge built with version 2.0 opens with a guide that explains it and says how to present it.

## Operating Context

- Plain HTML, CSS and an optional script. Pages load Vici from jsDelivr, pinned to a release tag, or from a local copy of `dist/` and `assets/fonts/`; the documentation runs on GitHub Pages from `main` and from disk.
- Prototypes keep an unchanged, pinned copy of Vici in `vici/` and are updated together. Some run under a strict content security policy that allows only their own files.
- The sources live in `src/`; `node scripts/build.mjs` generates `dist/`, the documentation pages, the starters, the logos and the integrations, and `npm run check` and `npm run check:render` verify them.
- Partners present prototypes in meetings; first-time viewers open them from a link.

## Capabilities and Constraints

- Today: tokens in `src/tokens/tokens.json`, more than forty components, 64 icons, light and dark themes, four starters (app, dashboard, landing, blank), integrations, and checks for contrast, the hexagon rule, fonts, documentation links, logos, exports and build freshness.
- No framework, no dependencies, no third-party requests or trackers; fonts are self-hosted. Plain HTML must look right without classes.
- Renaming or removing a `vc-*` class or a token is a breaking change and needs a major version.
- Generated files are never edited by hand.
- Documentation links stay relative so the site works from disk and on GitHub Pages.
- The site is written in British English. Some prototypes and demos will be in German, so the How it works guide's built-in words (Back, Next, the chapter count, the title) must be translatable (confirmed November 2026).
- The documentation may link to the live prototypes but shows no screenshots of them (confirmed November 2026).
- Open: the monogram (five options on the Logo page), and the move of the personal site from `https://victorpflueger.github.io/VIP/index.html` to its own domain.

## Brand Commitments

- Victor's Vertex logo, wordmark, monograms and portrait are reserved: place them, don't redraw them.
- Every prototype, demo and website made with Vici, the personal site included, says that Victor built it. Today that is the "Built by" byline; its look may change, but it appears on every surface, names him unmistakably and links to his profile and his website with `rel="author"`.
- Fonts: Bricolage Grotesque for display, Inter for text, JetBrains Mono for code. Inter is a deliberate choice and stays.
- Canonical profiles: `https://www.linkedin.com/in/victorpflueger` and `https://github.com/VictorPflueger`. A project built with Vici doesn't link to its own repository unless that is required.
- Non-negotiables from the 2.0 brief: cells, not circles; deep base, soft light; data first; zero friction; accessible by default; light and dark themes with self-hosted fonts; the reserved personal brand; built by Victor. Changes to the second to sixth, or to the fonts, need Victor's explicit approval.

## Evidence on Hand

- The live documentation at `https://victorpflueger.github.io/ViciDesign/`.
- The four starters in `starters/`, including the "Atlas" app prototype.
- Five live prototypes on GitHub Pages: Dispatch Lab, Rebate Hunter, Navigator, Timetable Translator and Repack Pilot. Dispatch Lab's guide is the reference for the new How it works standard.
- Victor's portrait in `assets/brand/` and other brands' profile logos in `assets/marks/`.
- There are no testimonials, usage figures or outside adopters. Nothing of the kind may be invented.

## Product Principles

1. Every surface says who built it.
2. A cold start, by an agent or by Victor, reaches a working page quickly and without guessing.
3. Show real pages built with Vici rather than decoration about Vici.
4. Rules are exact enough to check, and the build checks them.
5. Nothing loads from a third party, and plain HTML stays correct.

## Accessibility & Inclusion

WCAG 2.2 AA for every semantic colour pair in both themes, verified by the build; visible focus, hexagonal on hexagon controls; full keyboard support; reduced motion; Windows contrast themes; reflow at 320 px; text that grows with the reader's settings. Prototypes may be in English or German.
