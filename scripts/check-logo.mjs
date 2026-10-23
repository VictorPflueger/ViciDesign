#!/usr/bin/env node
// Logo suggestions: at least four distinct concepts, each as well-formed SVG in colour, dark
// and mono, with a title, a viewBox and no circles — and every file shown on the brand page.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT, read } from './lib/files.mjs';

const failures = [];
const CONCEPTS = ['vertex', 'facet', 'honeycomb', 'monogram', 'wordmark'];
const VARIANTS = ['color', 'dark', 'mono'];

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

const shapeHashes = new Map();
let files = 0;
for (const concept of CONCEPTS) {
  for (const variant of VARIANTS) {
    const path = `assets/logo/${concept}/${variant}.svg`;
    if (!existsSync(join(ROOT, path))) { failures.push(`missing ${path}`); continue; }
    const svg = read(path);
    files++;
    const err = wellFormed(svg);
    if (err) failures.push(`${path}: not well-formed (${err})`);
    if (!/^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svg)) failures.push(`${path}: missing <svg xmlns>`);
    if (!/viewBox="[\d.\s-]+"/.test(svg)) failures.push(`${path}: missing viewBox`);
    if (!/<title>[^<]+<\/title>/.test(svg) || !/role="img"/.test(svg)) failures.push(`${path}: needs role="img" and a <title>`);
    if (/<(circle|ellipse)\b/.test(svg)) failures.push(`${path}: contains a circle`);
    // geometry fingerprint: coordinates only, colours stripped
    const geometry = (svg.match(/\b(d|points)="[^"]+"/g) || []).join('|');
    if (variant === 'mono') shapeHashes.set(concept, createHash('sha1').update(geometry).digest('hex'));
  }
}
const distinct = new Set(shapeHashes.values());
if (distinct.size < 4) failures.push(`only ${distinct.size} geometrically distinct concepts (need at least 4)`);

// Extras for the recommended concept.
for (const extra of ['assets/logo/vertex/tile.svg', 'assets/logo/vertex/lockup.svg', 'assets/logo/vertex/lockup-dark.svg', 'assets/logo/favicon.svg']) {
  if (!existsSync(join(ROOT, extra))) failures.push(`missing ${extra}`);
  else if (wellFormed(read(extra))) failures.push(`${extra}: not well-formed`);
}

// The brand page shows every concept and variant and explains each one.
const page = read('brand/logo.html');
for (const concept of CONCEPTS) {
  for (const variant of VARIANTS) {
    if (!page.includes(`assets/logo/${concept}/${variant}.svg`)) failures.push(`brand/logo.html does not show ${concept}/${variant}.svg`);
  }
}
const ideas = (page.match(/<strong>The idea:<\/strong>/g) || []).length;
if (ideas < CONCEPTS.length) failures.push(`brand/logo.html explains ${ideas} concepts, expected ${CONCEPTS.length}`);
if (!/href="[^"]*assets\/logo\/favicon\.svg"/.test(read('index.html'))) failures.push('index.html does not use the favicon');

if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  process.exit(1);
}
console.log(`${distinct.size} geometrically distinct concepts, ${files} variant files (colour, dark, mono), all well-formed and circle-free.`);
console.log(`Brand page shows every variant and explains ${ideas} concepts; favicon, app icon and lockups present.`);
console.log('LOGO OK');
