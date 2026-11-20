#!/usr/bin/env node
// Documentation integrity: required guideline topics and sections exist, every page has the
// basic document metadata, ids are unique, and every internal link and anchor resolves. The docs
// pages and starters also keep to the Writing guideline's checkable rules: no eyebrows or aurora,
// no numbered headings with a middle dot, no list items that start with a bold label and a colon,
// no em dashes as punctuation and no stock words from src/docs/banned-words.json. A self-test
// first proves that each of those rules catches a planted example and passes a clean one.
import { existsSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { ROOT, read, sitePages } from './lib/files.mjs';
import { writingProblems, BANNED } from './lib/writing.mjs';

// ------------------------------------------------------------- writing rules
// Prototypes import the rule from scripts/lib/writing.mjs; this export stays for older imports.
export { writingProblems };

const PLANTED = {
  eyebrow: '<p class="vc-eyebrow">Guidelines</p><h1>Colour</h1>',
  aurora: '<section class="doc-hero vc-bg-aurora"><h1>Vici</h1></section>',
  'numbered heading': '<h3>1 · Cells, not circles</h3>',
  'bold label and colon': '<ul><li><strong>Performance:</strong> faster loading</li></ul>',
  'bold label, colon after it': '<ul><li><strong>Performance</strong>: faster loading</li></ul>',
  'bold label, token, colon': '<ul><li><strong>Canvas</strong> (<code>--vc-bg</code>): the page</li></ul>',
  'em dash': '<p>Built for speed — and for you.</p>',
  'stock word': '<p>A seamless way to build pages.</p>',
  'stock word, inflected': '<p>It streamlines the review.</p>',
  'stock phrase': '<p>In today’s world, pages matter.</p>',
};
const CLEAN = '<table class="vc-table" data-doc-banned><tr><td>seamless — robust</td><td><strong>Performance:</strong> x</td></tr></table>'
  + '<h3>Cells carry meaning</h3><ul><li><strong>Keep the same order everywhere.</strong> LinkedIn first.</li></ul>'
  + '<table><tr><td>4</td><td>—</td></tr></table><pre><code>a — b</code></pre><p>10–20&nbsp;px, a robustness test in a landscape layout.</p>';
const selfFailures = [];
for (const [name, html] of Object.entries(PLANTED)) if (!writingProblems(html).length) selfFailures.push(`missed the planted ${name}`);
const cleanProblems = writingProblems(CLEAN);
if (cleanProblems.length) selfFailures.push(`rejected clean text: ${cleanProblems.join('; ')}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}

// ------------------------------------------------------------- pages
const failures = [];
const pages = sitePages();
const idsOf = new Map();
const ID = /\sid="([^"]+)"/g;

for (const page of pages) {
  const html = read(page);
  const ids = [...html.matchAll(ID)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) failures.push(`${page}: duplicate id(s) ${[...new Set(dupes)].join(', ')}`);
  idsOf.set(page, new Set(ids));
  if (!/<html lang="(en-GB|de(-[A-Z]{2})?)"/.test(html)) failures.push(`${page}: <html> needs lang="en-GB" (or "de" for a German page)`);
  for (const problem of writingProblems(html)) failures.push(`${page}: ${problem}`);
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${page}: missing <title>`);
  if (!/<meta name="viewport"/.test(html)) failures.push(`${page}: missing viewport meta`);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) failures.push(`${page}: has ${h1} <h1> elements (expected 1)`);
}

// Required guideline topics, by page and section id.
const REQUIRED = {
  'guidelines/principles.html': ['the-idea-a-honeycomb', 'principles', 'signed', 'explained'],
  'guidelines/writing.html': ['voice', 'headings-and-labels', 'numbers-and-units', 'punctuation', 'patterns-vici-doesnt-use', 'stock-words', 'german'],
  'guidelines/colour.html': ['the-base-colour', 'palette', 'colour-coding', 'status-separation', 'semantic-tokens', 'contrast', 'the-dark-theme'],
  'guidelines/typography.html': ['typefaces', 'type-scale', 'text-styles', 'capitals', 'numbers'],
  'guidelines/hexagon.html': ['anatomy', 'where-cells-appear', 'cells-carry-meaning', 'sizes', 'rectangles', 'recipes', 'honeycomb-layout'],
  'guidelines/layout.html': ['spacing-scale', 'containers-and-breakpoints', 'layout-primitives'],
  'guidelines/elevation.html': ['surface-levels', 'shadows', 'layers-z-index'],
  'guidelines/motion.html': ['durations-and-easing', 'reduced-motion'],
  'guidelines/icons.html': ['the-set', 'using-icons'],
  'guidelines/data-viz.html': ['palettes', 'examples', 'rules'],
  'guidelines/accessibility.html': ['focus', 'keyboard-patterns', 'semantics-checklist'],
  'brand/logo.html': ['symbol', 'lockup', 'app-icon-and-favicon', 'wordmark', 'monogram', 'monogram-ligature', 'monogram-stem', 'monogram-cell', 'monogram-seal', 'monogram-initials', 'monogram-compare', 'usage', 'earlier-concepts'],
  'brand/profile-links.html': ['every-surface', 'byline', 'byline-several', 'byline-anywhere', 'in-footers-and-contact-sections', 'personal-site', 'other-brands-logos', 'link-rules', 'portrait'],
  'components/guide.html': ['title-pattern', 'chapters', 'copy-rules', 'content-format', 'german-example', 'behaviour', 'opening', 'presenting', 'check'],
  // The sections the How it works guide is built from.
  'components/actions.html': ['button'],
  'components/overlays.html': ['dialog'],
  'components/navigation.html': ['stepper'],
  'start/getting-started.html': [],
  'start/theming.html': ['theme-islands', 'override-tokens'],
  'start/integrations.html': ['streamlit', 'power-bi', 'python-matplotlib-and-plotly', 'tailwind-css-v4'],
  'start/tokens.html': ['all-tokens'],
};
for (const [page, ids] of Object.entries(REQUIRED)) {
  if (!idsOf.has(page)) { failures.push(`missing page ${page}`); continue; }
  for (const id of ids) if (!idsOf.get(page).has(id)) failures.push(`${page}: missing section #${id}`);
}

// Links and anchors.
let links = 0;
for (const page of pages) {
  // code samples and comments mention example URLs that are not meant to resolve
  const html = read(page).replace(/<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>|<!--[\s\S]*?-->/g, '');
  for (const m of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    const url = m[2];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(url) || url === '#') continue;
    links++;
    const [path, hash] = url.split('#');
    const target = path ? posix.normalize(posix.join(posix.dirname(page), path)) : page;
    if (path && !existsSync(join(ROOT, target))) { failures.push(`${page}: broken link ${url}`); continue; }
    if (hash && target.endsWith('.html')) {
      const ids = idsOf.get(target);
      if (!ids) { failures.push(`${page}: link into a non-site page ${url}`); continue; }
      if (!ids.has(hash)) failures.push(`${page}: missing anchor ${url}`);
    }
  }
}

if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  console.error(`\n${failures.length} documentation problem(s)`);
  process.exit(1);
}
console.log(`${pages.length} pages checked: metadata, unique ids, one h1 each, ${Object.keys(REQUIRED).length} required topics present.`);
console.log(`${links} internal links and anchors resolve.`);
console.log(`Writing rules hold on every page: ${Object.keys(PLANTED).length} planted patterns caught and clean text passed first, ${BANNED.length} stock words checked.`);
console.log('DOCS OK');
