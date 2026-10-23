#!/usr/bin/env node
// The hexagon rule: no circle or pill geometry anywhere, and every component that would
// usually be round is built from hexagon geometry. A self-test first proves that the
// scanner catches planted violations.
import { listFiles, read, sitePages } from './lib/files.mjs';

// ------------------------------------------------------------------ scanners
const ROUND_RADIUS = /border-(?:[a-z]+-)*radius\s*:\s*([^;}"]+)/gi;

function roundRadii(text) {
  const hits = [];
  for (const m of text.matchAll(ROUND_RADIUS)) {
    const value = m[1].trim();
    const tooRound = value.split(/[\s/]+/).some((part) => {
      const n = parseFloat(part);
      if (Number.isNaN(n)) return false;
      if (/%$/.test(part)) return n >= 25;
      if (/px$/.test(part)) return n >= 40;
      if (/r?em$/.test(part)) return n >= 2.5;
      if (/(vmax|vmin|vh|vw|dvh|svh|lvh)$/.test(part)) return true;
      return false;
    });
    if (tooRound) hits.push(`border-radius: ${value}`);
  }
  return hits;
}

function roundShapes(text) {
  const hits = [];
  for (const m of text.matchAll(/(clip-path|shape-outside|offset-path)\s*:\s*[^;}]*\b(circle|ellipse)\(/gi)) hits.push(m[0]);
  for (const m of text.matchAll(/(?:-webkit-)?mask(?:-image)?\s*:\s*[^;}]*radial-gradient\(\s*(circle|ellipse|closest|farthest)/gi)) hits.push(m[0]);
  return hits;
}

function svgCircles(text) {
  const hits = [];
  for (const m of text.matchAll(/<(circle|ellipse)\b/gi)) hits.push(`<${m[1]}>`);
  // rounded rectangles that are really pills or circles: rx ≥ half the height
  for (const m of text.matchAll(/<rect\b[^>]*>/gi)) {
    const tag = m[0];
    const rx = parseFloat((tag.match(/\brx="([\d.]+)"/) || [])[1]);
    const h = parseFloat((tag.match(/\bheight="([\d.]+)"/) || [])[1]);
    const w = parseFloat((tag.match(/\bwidth="([\d.]+)"/) || [])[1]);
    if (rx && ((h && rx >= h / 2 - 0.01) || (w && rx >= w / 2 - 0.01))) hits.push(tag.slice(0, 80));
  }
  return hits;
}

function scan(name, text, kind) {
  const hits = [];
  if (kind === 'css' || kind === 'html') hits.push(...roundRadii(text), ...roundShapes(text));
  if (kind === 'svg' || kind === 'html' || kind === 'css') hits.push(...svgCircles(kind === 'css' ? decodeURIComponent(text.replace(/%(?![0-9a-f]{2})/gi, '%25')) : text));
  return hits.map((h) => `${name}: ${h}`);
}

// ------------------------------------------------------------------ self-test
const fixtures = [
  ['.a { border-radius: 50%; }', 'css'],
  ['.a { border-radius: 9999px; }', 'css'],
  ['.a { border-top-left-radius: 3rem; }', 'css'],
  ['.a { clip-path: circle(40%); }', 'css'],
  ['.a { mask-image: radial-gradient(circle, #000 60%, transparent 61%); }', 'css'],
  ['<svg><circle cx="5" cy="5" r="4"/></svg>', 'svg'],
  ['<svg><rect width="20" height="10" rx="5"/></svg>', 'svg'],
  ['<span style="border-radius: 999px">pill</span>', 'html'],
  [".a { background: url(\"data:image/svg+xml,%3Csvg%3E%3Ccircle r='2'/%3E%3C/svg%3E\"); }", 'css'],
];
for (const [text, kind] of fixtures) {
  if (!scan('fixture', text, kind).length) {
    console.error(`self-test failed: scanner missed a planted violation in: ${text}`);
    process.exit(1);
  }
}
const cleanFixture = '.a { border-radius: 6px; clip-path: var(--vc-hex); } <svg><rect width="20" height="10" rx="2"/></svg>';
if (scan('clean', cleanFixture, 'html').length) {
  console.error('self-test failed: scanner flagged a legitimate rule');
  process.exit(1);
}

// ------------------------------------------------------------------ real files
const failures = [];
const cssFiles = [...listFiles('src', (f) => f.endsWith('.css')), ...listFiles('dist', (f) => f.endsWith('.css')), ...listFiles('assets/docs', (f) => f.endsWith('.css')), ...listFiles('integrations', (f) => f.endsWith('.css'))];
const svgFiles = [...listFiles('src/icons', (f) => f.endsWith('.svg')), ...listFiles('assets/logo', (f) => f.endsWith('.svg')), 'dist/vici-icons.svg'];
const htmlFiles = [...sitePages(), ...listFiles('src/docs', (f) => f.endsWith('.html')), ...listFiles('src/starters', (f) => f.endsWith('.html'))];

for (const f of cssFiles) failures.push(...scan(f, read(f), 'css'));
for (const f of svgFiles) failures.push(...scan(f, read(f), 'svg'));
for (const f of htmlFiles) failures.push(...scan(f, read(f), 'html'));

// No "full" radius token may exist.
const tokens = JSON.parse(read('src/tokens/tokens.json'));
for (const key of Object.keys(tokens.radius)) if (/full|pill|round|circle/i.test(key)) failures.push(`tokens.json: radius.${key} looks like a circle token`);

// ------------------------------------------------------- hexagon construction
// Every component that would usually be round must build its shape from hexagon geometry.
const css = read('dist/vici.css').replace(/\/\*[\s\S]*?\*\//g, '');
const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selectors: m[1].split(',').map((s) => s.trim().replace(/\s+/g, ' ')), body: m[2] }));
const HEX = /clip-path\s*:\s*(var\(--vc-hex\)|polygon\()/;
const required = [
  ['.vc-avatar', 'avatar'],
  ['.vc-radio > input', 'radio'],
  ['.vc-switch > input', 'switch track (capsule)'],
  ['.vc-switch::after', 'switch knob'],
  ['.vc-slider::-webkit-slider-thumb', 'slider thumb (WebKit)'],
  ['.vc-slider::-moz-range-thumb', 'slider thumb (Firefox)'],
  ['.vc-badge::after', 'badge'],
  ['.vc-presence::after', 'presence dot'],
  ['.vc-spinner', 'spinner'],
  ['.vc-progress-hex::before', 'progress ring'],
  ['.vc-progress', 'progress track (capsule)'],
  ['.vc-progress__bar', 'progress fill (capsule)'],
  ['.vc-icon-button::before', 'icon button'],
  ['.vc-icon-button::after', 'icon button focus ring'],
  ['.vc-pagination__page::before', 'pagination page'],
  ['.vc-step__marker::before', 'stepper marker'],
  ['.vc-carousel__dots > button::before', 'carousel dot'],
  ['.vc-rating > label::before', 'rating cell'],
  ['.vc-timeline > li::after', 'timeline marker'],
  ['.vc-legend > li::before', 'legend swatch'],
  ['.vc-list > li::before', 'list bullet'],
  ['.vc-chip::before', 'chip (capsule)'],
  ['.vc-chip::after', 'chip focus ring'],
  ['.vc-tag::before', 'tag (capsule)'],
  ['.vc-skeleton--hex', 'avatar skeleton'],
  ['.vc-cell', 'icon cell'],
  ['.vc-tile', 'honeycomb tile'],
  ['.vc-radio::before', 'radio focus ring'],
  ['.vc-switch::before', 'switch focus ring'],
  ['.vc-eyebrow::before', 'eyebrow marker'],
  ['.vc-sidenav a[aria-current=\'page\']::before', 'current-page marker'],
];
let hexComponents = 0;
for (const [sel, label] of required) {
  const matching = blocks.filter((b) => b.selectors.includes(sel));
  if (!matching.length) { failures.push(`dist/vici.css: no rule for ${sel} (${label})`); continue; }
  if (!matching.some((b) => HEX.test(b.body))) failures.push(`dist/vici.css: ${sel} (${label}) is not built from hexagon geometry`);
  else hexComponents++;
}

if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  console.error(`\n${failures.length} hexagon-rule violation(s)`);
  process.exit(1);
}
console.log(`Self-test caught ${fixtures.length}/${fixtures.length} planted violations.`);
console.log(`Scanned ${cssFiles.length} CSS, ${svgFiles.length} SVG and ${htmlFiles.length} HTML files: no circles or pills.`);
console.log(`${hexComponents}/${required.length} would-be-round components are built from hexagon geometry.`);
console.log('HEX OK');
