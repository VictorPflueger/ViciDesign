#!/usr/bin/env node
// Documentation integrity: required guideline topics and sections exist, every page has the
// basic document metadata, ids are unique, and every internal link and anchor resolves.
import { existsSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { ROOT, read, sitePages } from './lib/files.mjs';

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
  if (!/<html lang="[a-z-]+"/.test(html)) failures.push(`${page}: <html> has no lang`);
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${page}: missing <title>`);
  if (!/<meta name="viewport"/.test(html)) failures.push(`${page}: missing viewport meta`);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) failures.push(`${page}: has ${h1} <h1> elements (expected 1)`);
}

// Required guideline topics, by page and section id.
const REQUIRED = {
  'guidelines/principles.html': ['the-idea-a-honeycomb', 'principles'],
  'guidelines/colour.html': ['the-base-colour', 'palette', 'colour-coding', 'semantic-tokens', 'contrast', 'the-dark-theme'],
  'guidelines/typography.html': ['typefaces', 'type-scale', 'text-styles', 'numbers'],
  'guidelines/hexagon.html': ['anatomy', 'where-cells-appear', 'sizes', 'rectangles', 'recipes', 'honeycomb-layout'],
  'guidelines/layout.html': ['spacing-scale', 'containers-and-breakpoints', 'layout-primitives'],
  'guidelines/elevation.html': ['surface-levels', 'shadows', 'layers-z-index'],
  'guidelines/motion.html': ['durations-and-easing', 'reduced-motion'],
  'guidelines/icons.html': ['the-set', 'using-icons'],
  'guidelines/data-viz.html': ['palettes', 'examples', 'rules'],
  'guidelines/accessibility.html': ['focus', 'keyboard-patterns', 'semantics-checklist'],
  'brand/logo.html': ['symbol', 'lockup', 'app-icon-and-favicon', 'wordmark', 'monogram', 'monogram-ligature', 'monogram-stem', 'monogram-cell', 'monogram-seal', 'monogram-initials', 'monogram-compare', 'usage', 'earlier-concepts'],
  'brand/profile-links.html': ['byline', 'byline-several', 'in-footers-and-contact-sections', 'other-brands-logos', 'link-rules', 'portrait'],
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
console.log('DOCS OK');
