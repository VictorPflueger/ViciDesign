#!/usr/bin/env node
// Verifies the colour system: base colour, ramp completeness, pastel character and
// WCAG 2.2 contrast for every semantic pairing in both themes. Exit 1 on any failure.
import { loadTokens, flatten, resolvedTheme } from './lib/tokens.mjs';
import { contrast, hexToOklch, deltaOk, simulate } from './lib/color.mjs';

const tokens = loadTokens();
const flat = flatten(tokens);
const failures = [];
const fail = (msg) => failures.push(msg);
const HEX = /^#[0-9a-f]{6}$/;

// 1. The brand base colour is exactly #250010 and anchors both themes.
if (flat['color.merlot.950']?.value !== '#250010') fail('color.merlot.950 must be #250010');
if (flat['color.night.2']?.value !== '#250010') fail('color.night.2 (dark canvas) must be #250010');

// 2. Every chromatic family has the full 50-950 ramp, valid hex, monotonic lightness.
const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const PASTEL_FAMILIES = ['merlot', 'coral', 'apricot', 'honey', 'sage', 'teal', 'fjord', 'lilac'];
for (const fam of PASTEL_FAMILIES) {
  let prevL = Infinity;
  for (const s of STEPS) {
    const v = flat[`color.${fam}.${s}`]?.value;
    if (!v || !HEX.test(v)) { fail(`color.${fam}.${s} missing or not #rrggbb`); continue; }
    const [L] = hexToOklch(v);
    if (L >= prevL) fail(`color.${fam}.${s} is not darker than the previous step`);
    prevL = L;
  }
  // 3. Pastel character: steps 100-300 are light (OKLCH L >= 0.83) and soft (0.015 <= C <= 0.10).
  for (const s of ['100', '200', '300']) {
    const v = flat[`color.${fam}.${s}`]?.value;
    if (!v) continue;
    const [L, C] = hexToOklch(v);
    if (L < 0.83 || C > 0.1 || C < 0.015) fail(`color.${fam}.${s} ${v} is not pastel (L=${L.toFixed(3)} C=${C.toFixed(3)})`);
  }
}

// 4. Contrast requirements per theme. [foreground, [backgrounds], minimum ratio]
const TEXT = 4.5;
const UI = 3;
const RULES = [
  ['text', ['bg', 'bg-subtle', 'surface', 'surface-raised', 'surface-hover', 'surface-selected'], 7],
  ['text-muted', ['bg', 'bg-subtle', 'surface', 'surface-raised', 'surface-hover'], TEXT],
  ['text-subtle', ['bg', 'surface', 'surface-raised'], TEXT],
  ['text-link', ['bg', 'bg-subtle', 'surface', 'surface-raised'], TEXT],
  ['text-link-hover', ['bg', 'surface'], TEXT],
  ['text-inverse', ['surface-inverse'], TEXT],
  ['on-accent', ['accent', 'accent-hover', 'accent-pressed'], TEXT],
  ['on-accent-soft', ['accent-soft', 'accent-soft-hover'], TEXT],
  ['accent-text', ['bg', 'surface', 'surface-raised'], TEXT],
  ['accent', ['bg', 'surface'], UI],
  ['border-strong', ['bg', 'surface', 'surface-raised'], UI],
  ['focus', ['bg', 'bg-subtle', 'surface', 'surface-raised'], UI],
  ['chart-axis', ['bg', 'surface'], TEXT],
  ['rating', ['bg', 'surface'], UI],
  ['knob', ['border-strong'], UI],
  ['platform-mark', ['bg', 'bg-subtle', 'surface', 'surface-raised', 'surface-hover'], UI],
];
for (const s of ['info', 'success', 'warning', 'danger', 'feature', 'neutral']) {
  RULES.push([`${s}-text`, [`${s}-bg`, 'bg', 'surface'], TEXT]);
  RULES.push([`${s}-on-solid`, [`${s}-solid`], TEXT]);
}
for (let i = 1; i <= 8; i++) RULES.push([`data-${i}`, ['surface', 'bg'], UI]);
RULES.push(['seq-7', ['seq-1'], UI]);

let pairs = 0;
let minSeen = Infinity;
for (const theme of ['light', 'dark']) {
  const t = resolvedTheme(tokens, theme);
  for (const [fg, bgs, min] of RULES) {
    for (const bg of bgs) {
      if (!t[fg] || !t[bg]) { fail(`${theme}: missing token ${!t[fg] ? fg : bg}`); continue; }
      const r = contrast(t[fg], t[bg]);
      pairs++;
      minSeen = Math.min(minSeen, r / min);
      if (r + 1e-9 < min) fail(`${theme}: ${fg} ${t[fg]} on ${bg} ${t[bg]} = ${r.toFixed(2)}:1 (needs ${min}:1)`);
    }
  }
}

// 5. Categorical chart colours (data-1..6) stay apart for normal vision and under protan, deutan
//    and tritan simulation (minimum OKLab distance; tritan weighted because it is rarer).
const MIN_DELTA = 0.08;
for (const theme of ['light', 'dark']) {
  const t = resolvedTheme(tokens, theme);
  const series = [1, 2, 3, 4, 5, 6].map((i) => t[`data-${i}`]);
  for (const mode of ['normal', 'protan', 'deutan', 'tritan']) {
    const sim = series.map((c) => (mode === 'normal' ? c : simulate(c, mode)));
    const weight = mode === 'tritan' ? 1.6 : 1;
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const d = deltaOk(sim[i], sim[j]) * weight;
        if (d < MIN_DELTA) fail(`${theme}: data-${i + 1} and data-${j + 1} are too close under ${mode} vision (ΔOK ${d.toFixed(3)})`);
      }
    }
  }
}

if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  console.error(`\n${failures.length} token check(s) failed`);
  process.exit(1);
}
console.log(`${pairs} contrast pairs checked across light and dark; weakest pair has ${(minSeen).toFixed(2)}× its minimum.`);
console.log('TOKENS OK');
