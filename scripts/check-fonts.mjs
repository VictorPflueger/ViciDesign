#!/usr/bin/env node
// Typography: only the three OFL fonts, self-hosted as real WOFF2 files with their licences,
// and no font requested from a third-party host anywhere in the system or the docs.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listFiles, read, sitePages } from './lib/files.mjs';

const failures = [];
const FAMILIES = {
  'Bricolage Grotesque': 'assets/fonts/OFL-BricolageGrotesque.txt',
  Inter: 'assets/fonts/OFL-Inter.txt',
  'JetBrains Mono': 'assets/fonts/OFL-JetBrainsMono.txt',
};
// Vici's own one-glyph font for password masks, generated from code (no third-party licence).
const OWN = { 'Vici Mask': 'scripts/brand/mask-font.py' };

const css = read('dist/vici.css');
const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
if (faces.length < 3) failures.push(`expected @font-face rules for three families, found ${faces.length}`);
const seen = new Set();
for (const face of faces) {
  const family = (face.match(/font-family:\s*'([^']+)'/) || [])[1];
  if (OWN[family]) {
    if (!existsSync(join(ROOT, OWN[family]))) failures.push(`${family}: generator ${OWN[family]} missing`);
    if (!/unicode-range:\s*U\+2022/.test(face)) failures.push(`${family}: must be limited to the bullet code points`);
  } else if (!FAMILIES[family]) { failures.push(`unexpected font family in @font-face: ${family}`); continue; }
  else seen.add(family);
  const urls = [...face.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]);
  if (!urls.length) failures.push(`${family}: @font-face without a url()`);
  for (const url of urls) {
    if (/^(https?:)?\/\//.test(url)) { failures.push(`${family}: remote font source ${url}`); continue; }
    const file = join(ROOT, 'dist', url);
    if (!existsSync(file)) { failures.push(`${family}: missing file ${url}`); continue; }
    const magic = readFileSync(file).subarray(0, 4).toString('latin1');
    if (magic !== 'wOF2') failures.push(`${family}: ${url} is not a WOFF2 file`);
  }
}
for (const [family, licence] of Object.entries(FAMILIES)) {
  if (!seen.has(family)) failures.push(`no @font-face for ${family}`);
  if (!existsSync(join(ROOT, licence))) failures.push(`missing licence file ${licence}`);
  else if (!/SIL Open Font License/.test(read(licence))) failures.push(`${licence} is not the SIL Open Font License`);
}

// The token stacks lead with the bundled families.
const tokens = JSON.parse(read('src/tokens/tokens.json'));
const fam = tokens.font.family;
if (fam.display.$value[0] !== 'Bricolage Grotesque') failures.push('font.family.display must start with Bricolage Grotesque');
if (fam.text.$value[0] !== 'Inter') failures.push('font.family.text must start with Inter');
if (fam.mono.$value[0] !== 'JetBrains Mono') failures.push('font.family.mono must start with JetBrains Mono');

// No third-party font hosts anywhere.
const THIRD_PARTY = /(fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net|fast\.fonts\.net|use\.fontawesome\.com)/i;
const files = [...sitePages(), ...listFiles('dist', (f) => /\.(css|js)$/.test(f)), ...listFiles('src', (f) => /\.(css|html|js)$/.test(f)), ...listFiles('assets/docs')];
for (const f of files) {
  const m = read(f).match(THIRD_PARTY);
  if (m) failures.push(`${f} references a third-party font host: ${m[0]}`);
}

if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  process.exit(1);
}
console.log(`${faces.length} @font-face rules, all self-hosted WOFF2 files: ${[...seen].join(', ')} (SIL OFL 1.1) and Vici's own password-mask font.`);
console.log(`${files.length} files contain no third-party font requests.`);
console.log('FONTS OK');
