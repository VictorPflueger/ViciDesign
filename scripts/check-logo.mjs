#!/usr/bin/env node
// Logo files and the brand page. Vertex is the logo: symbol (colour, dark, mono), app icon,
// lockups and favicon. Five monogram options, each in colour, dark, mono and tile, all
// geometrically different from each other and from the dropped first draft. Facet and
// Honeycomb stay in the archive. Every file is well-formed SVG with a title, a viewBox and no
// circles, and the brand page shows every file and explains every design.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT, read } from './lib/files.mjs';

const failures = [];
const VARIANTS = ['color', 'dark', 'mono'];
const MONOGRAMS = ['ligature', 'stem', 'cell', 'seal', 'initials'];
const ARCHIVE = ['facet', 'honeycomb'];
// geometry fingerprint of the first monogram draft (one stroked line), which was rejected
const DROPPED_MONOGRAM = '0c8030ddb62160a45b50bec7d264f0f904bfe678';

/** Minimal XML well-formedness check for the simple SVGs we generate. */
function wellFormed(xml) {
  const stack = [];
  const body = xml.replace(/<\?xml[^>]*\?>/, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    const [, close, name, attrs, self] = m;
    if (/="[^"]*$/.test(attrs) || (attrs.match(/"/g) || []).length % 2) return `unbalanced quotes in <${name}>`;
    if (self) continue;
    if (close) {
      if (stack.pop() !== name) return `unexpected </${name}>`;
    } else stack.push(name);
  }
  return stack.length ? `unclosed <${stack.at(-1)}>` : '';
}

const geometry = (svg) => (svg.match(/\b(d|points)="[^"]+"/g) || []).join('|');
const fingerprint = (svg) => createHash('sha1').update(geometry(svg)).digest('hex');

let files = 0;
function checkFile(path) {
  if (!existsSync(join(ROOT, path))) { failures.push(`missing ${path}`); return ''; }
  const svg = read(path);
  files++;
  const err = wellFormed(svg);
  if (err) failures.push(`${path}: not well-formed (${err})`);
  if (!/^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svg)) failures.push(`${path}: missing <svg xmlns>`);
  if (!/viewBox="[\d.\s-]+"/.test(svg)) failures.push(`${path}: missing viewBox`);
  if (!/<title>[^<]+<\/title>/.test(svg) || !/role="img"/.test(svg)) failures.push(`${path}: needs role="img" and a <title>`);
  if (/<(circle|ellipse)\b/.test(svg)) failures.push(`${path}: contains a circle`);
  return svg;
}

// 1. Vertex, the chosen logo, with everything that belongs to it
for (const v of VARIANTS) checkFile(`assets/logo/vertex/${v}.svg`);
for (const extra of ['vertex/tile.svg', 'vertex/lockup.svg', 'vertex/lockup-dark.svg', 'favicon.svg']) checkFile(`assets/logo/${extra}`);
for (const v of [...VARIANTS, 'vici']) checkFile(`assets/logo/wordmark/${v}.svg`);

// 2. Monogram options: four files each, five different drawings, none of them the dropped draft
const monoShapes = new Map();
let monoFailures = failures.length;
for (const id of MONOGRAMS) {
  for (const v of [...VARIANTS, 'tile']) {
    const svg = checkFile(`assets/logo/monogram/${id}/${v}.svg`);
    if (!svg) continue;
    if (fingerprint(svg) === DROPPED_MONOGRAM) failures.push(`monogram/${id}/${v}.svg repeats the dropped first draft`);
    if (/stroke=/.test(svg)) failures.push(`monogram/${id}/${v}.svg uses strokes; the options are drawn as filled outlines`);
    if (v === 'mono') monoShapes.set(id, fingerprint(svg));
  }
}
if (new Set(monoShapes.values()).size !== MONOGRAMS.length) failures.push(`only ${new Set(monoShapes.values()).size} geometrically distinct monogram options (need ${MONOGRAMS.length})`);
for (const legacy of ['assets/logo/monogram/color.svg', 'assets/logo/monogram/dark.svg', 'assets/logo/monogram/mono.svg']) {
  if (existsSync(join(ROOT, legacy))) failures.push(`${legacy}: the dropped first monogram is still in the repository`);
}

// 3. Archived concepts
for (const id of ARCHIVE) for (const v of VARIANTS) checkFile(`assets/logo/archive/${id}/${v}.svg`);

// 4. The brand page: Vertex marked as chosen, every file shown, every design explained
const page = read('brand/logo.html');
if (!/Logo: Vertex/.test(page)) failures.push('brand/logo.html does not state that Vertex is the logo');
const shown = (p) => page.includes(`assets/logo/${p}`);
for (const p of ['vertex/color.svg', 'vertex/dark.svg', 'vertex/mono.svg', 'vertex/tile.svg', 'vertex/lockup.svg', 'vertex/lockup-dark.svg', 'favicon.svg', 'wordmark/color.svg', 'wordmark/dark.svg', 'wordmark/mono.svg', 'wordmark/vici.svg']) {
  if (!shown(p)) failures.push(`brand/logo.html does not show ${p}`);
}
for (const id of MONOGRAMS) {
  for (const v of [...VARIANTS, 'tile']) if (!shown(`monogram/${id}/${v}.svg`)) failures.push(`brand/logo.html does not show monogram/${id}/${v}.svg`);
  const section = page.split(`id="monogram-${id}"`)[1]?.split(/<h[23][ >]/)[0] || '';
  if (!/<strong>The idea:<\/strong>/.test(section)) failures.push(`brand/logo.html: monogram "${id}" has no section explaining the idea`);
  if (!/<strong>Good for:<\/strong>/.test(section)) failures.push(`brand/logo.html: monogram "${id}" does not say what it's good for`);
}
for (const id of ARCHIVE) for (const v of VARIANTS) if (!shown(`archive/${id}/${v}.svg`)) failures.push(`brand/logo.html does not show archive/${id}/${v}.svg`);
const ideas = (page.match(/<strong>The idea( of [A-Z][a-z]+)?:<\/strong>/g) || []).length;
if (ideas < 1 + MONOGRAMS.length + ARCHIVE.length) failures.push(`brand/logo.html explains ${ideas} designs, expected ${1 + MONOGRAMS.length + ARCHIVE.length}`);
if (!/href="[^"]*assets\/logo\/favicon\.svg"/.test(read('index.html'))) failures.push('index.html does not use the favicon');
monoFailures = failures.length - monoFailures;

if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  process.exit(1);
}
console.log(`Vertex: symbol, app icon, lockups, favicon and wordmarks present. ${files} SVG files, all well-formed, titled and circle-free.`);
console.log(`${MONOGRAMS.length} monogram options (${MONOGRAMS.join(', ')}) in colour, dark, mono and tile, geometrically distinct and none of them the dropped draft.`);
console.log(`Brand page marks Vertex as the logo, shows every file and explains ${ideas} designs.`);
console.log('MONOGRAM OPTIONS OK');
console.log('LOGO OK');
