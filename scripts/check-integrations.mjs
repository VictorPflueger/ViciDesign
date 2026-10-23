#!/usr/bin/env node
// Exports for other tools parse correctly and carry exactly the generated palette.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, read } from './lib/files.mjs';
import { loadTokens, resolvedTheme } from './lib/tokens.mjs';

const failures = [];
const tokens = loadTokens();
const L = resolvedTheme(tokens, 'light');
const D = resolvedTheme(tokens, 'dark');
const series = (T) => [1, 2, 3, 4, 5, 6, 7, 8].map((i) => T[`data-${i}`]);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// dist/tokens.json
const dist = JSON.parse(read('dist/tokens.json'));
if (dist.light.accent !== '#250010') failures.push('dist/tokens.json: light.accent is not #250010');
if (dist.dark.bg !== '#250010') failures.push('dist/tokens.json: dark.bg is not #250010');
if (!eq(series(dist.light), series(L))) failures.push('dist/tokens.json: data colours differ from tokens');

// Power BI
for (const [name, T] of [['light', L], ['dark', D]]) {
  const file = `integrations/powerbi/vici-${name}.json`;
  let theme;
  try { theme = JSON.parse(read(file)); } catch (e) { failures.push(`${file}: invalid JSON (${e.message})`); continue; }
  if (!theme.name) failures.push(`${file}: no name`);
  if (!eq(theme.dataColors, series(T))) failures.push(`${file}: dataColors differ from the ${name} theme`);
  for (const key of ['foreground', 'background', 'tableAccent', 'good', 'bad', 'neutral']) if (!/^#[0-9a-f]{6}$/i.test(theme[key] || '')) failures.push(`${file}: ${key} is not a hex colour`);
}

// Streamlit (parsed with Python's tomllib when available)
const tomlCheck = (file, T, base) => {
  const py = `import tomllib,json,sys\nprint(json.dumps(tomllib.load(open(sys.argv[1],'rb'))))`;
  let parsed;
  try {
    parsed = JSON.parse(execFileSync('python3', ['-I', '-B', '-c', py, join(ROOT, file)], { encoding: 'utf8' }));
  } catch (e) {
    failures.push(`${file}: could not be parsed as TOML (${e.message.split('\n')[0]})`);
    return;
  }
  const t = parsed.theme || {};
  if (t.base !== base) failures.push(`${file}: base should be ${base}`);
  if (t.primaryColor !== T.accent) failures.push(`${file}: primaryColor ${t.primaryColor} ≠ accent ${T.accent}`);
  if (t.backgroundColor !== T.bg) failures.push(`${file}: backgroundColor ≠ bg`);
  if (t.textColor !== T.text) failures.push(`${file}: textColor ≠ text`);
};
tomlCheck('integrations/streamlit/config.toml', L, 'light');
tomlCheck('integrations/streamlit/config-dark.toml', D, 'dark');

// Python module: imports without matplotlib/plotly and exposes the palettes
try {
  const py = [
    'import sys, json',
    `sys.path.insert(0, ${JSON.stringify(join(ROOT, 'integrations/python'))})`,
    'import vici_palette as v',
    'print(json.dumps({"cat": v.CATEGORICAL, "catd": v.CATEGORICAL_DARK, "seq": v.SEQUENTIAL, "accent": v.LIGHT["accent"], "dark_bg": v.DARK["bg"], "merlot": v.COLORS["merlot"]["950"]}))',
  ].join('\n');
  const out = JSON.parse(execFileSync('python3', ['-I', '-B', '-c', py], { encoding: 'utf8' }));
  if (!eq(out.cat, series(L).slice(0, 6))) failures.push('vici_palette.CATEGORICAL differs from tokens');
  if (!eq(out.catd, series(D).slice(0, 6))) failures.push('vici_palette.CATEGORICAL_DARK differs from tokens');
  if (out.seq.length !== 7) failures.push('vici_palette.SEQUENTIAL should have 7 steps');
  if (out.accent !== '#250010' || out.dark_bg !== '#250010' || out.merlot !== '#250010') failures.push('vici_palette base colour mismatch');
} catch (e) {
  failures.push(`integrations/python/vici_palette.py failed to import (${e.message.split('\n')[0]})`);
}

// Streamlit byline helper: imports, escapes its label and points at this release's files
try {
  const py = [
    'import sys, json',
    `sys.path.insert(0, ${JSON.stringify(join(ROOT, 'integrations/streamlit'))})`,
    'from vici_byline import vici_byline',
    'print(json.dumps({"light": vici_byline(), "dark": vici_byline(dark=True, label="<b>x</b>")}))',
  ].join('\n');
  const out = JSON.parse(execFileSync('python3', ['-I', '-B', '-c', py], { encoding: 'utf8' }));
  const version = JSON.parse(read('package.json')).version;
  const cdn = `https://cdn.jsdelivr.net/gh/VictorPflueger/ViciDesign@v${version}/assets/`;
  for (const [name, html] of Object.entries(out)) {
    if (!html.includes(`${cdn}brand/portrait-96.jpg`)) failures.push(`vici_byline (${name}): portrait not loaded from the v${version} CDN`);
    if (!html.includes(`${cdn}marks/${name === 'dark' ? 'linkedin-white.png' : 'linkedin.png'}`)) failures.push(`vici_byline (${name}): wrong LinkedIn logo`);
    if (!html.includes('href="https://www.linkedin.com/in/victorpflueger" rel="author"')) failures.push(`vici_byline (${name}): profile link without rel="author"`);
    if (!html.includes('> on LinkedIn</span>')) failures.push(`vici_byline (${name}): link not named "on LinkedIn"`);
  }
  if (!out.light.includes(`color:${L.text}`) || !out.dark.includes(`color:${D.text}`)) failures.push('vici_byline: name colours differ from the theme text colours');
  if (out.dark.includes('<b>x</b>')) failures.push('vici_byline: the label is not escaped');
} catch (e) {
  failures.push(`integrations/streamlit/vici_byline.py failed (${e.message.split('\n')[0]})`);
}

// Tailwind v4 theme
const tw = read('integrations/tailwind/vici-theme.css');
if (!/^@theme \{$/m.test(tw)) failures.push('tailwind theme: no @theme block');
if (!tw.includes('--color-merlot-950: #250010;')) failures.push('tailwind theme: merlot-950 missing');
if (!/--font-display: 'Bricolage Grotesque'/.test(tw)) failures.push('tailwind theme: display font missing');
if ((tw.match(/\{/g) || []).length !== (tw.match(/\}/g) || []).length) failures.push('tailwind theme: unbalanced braces');

if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  process.exit(1);
}
console.log('Power BI (2), Streamlit (2 themes + byline helper), Python and Tailwind exports parse and match the tokens; dist/tokens.json is consistent.');
console.log('INTEGRATIONS OK');
