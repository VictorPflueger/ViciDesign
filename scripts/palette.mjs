#!/usr/bin/env node
// Generates the Vici colour primitives in OKLCH and writes them into src/tokens/tokens.json.
//
//   node scripts/palette.mjs            -> print the palette
//   node scripts/palette.mjs --write    -> update the "color" group in src/tokens/tokens.json
//
// Merlot is anchored on the brand base #250010 and the four colours of the original mood palette
// (#5c1230, #8f2f42, #c77d74, #f3ebe7). The other families share one lightness ladder so that
// "step 200" means the same visual weight in every hue.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { hexToOklch, oklchToHex, over } from './lib/color.mjs';

export const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

// Shared lightness/chroma ladder for the pastel families (chroma is scaled per family).
const LADDER = {
  50: [0.977, 0.014],
  100: [0.948, 0.032],
  200: [0.908, 0.052],
  300: [0.858, 0.072],
  400: [0.785, 0.094],
  500: [0.69, 0.112],
  600: [0.585, 0.122],
  700: [0.485, 0.114],
  800: [0.392, 0.094],
  900: [0.3, 0.07],
  950: [0.222, 0.05],
};

// hue = OKLCH hue angle, chroma = multiplier on the ladder, drift = hue shift towards the darks.
const FAMILIES = {
  coral: { hue: 33, chroma: 1.0, drift: -6, role: 'Danger, errors, destructive actions, negative trends' },
  apricot: { hue: 62, chroma: 0.95, drift: -8, role: 'Categories and data series, warm highlights' },
  honey: { hue: 92, chroma: 0.9, drift: -14, role: 'Warnings, attention, pending; rating cells' },
  sage: { hue: 148, chroma: 0.72, drift: 4, role: 'Success, positive, done' },
  teal: { hue: 196, chroma: 0.78, drift: 4, role: 'Categories and data series, calm accents' },
  fjord: { hue: 248, chroma: 0.82, drift: 6, role: 'Information, neutral notices' },
  lilac: { hue: 306, chroma: 0.85, drift: 4, role: 'AI-generated, experimental or new' },
};

// Merlot: brand ramp, anchored on exact hex values; the remaining steps are interpolated in OKLCH.
const MERLOT_ANCHORS = { 950: '#250010', 800: '#5c1230', 700: '#8f2f42', 500: '#c77d74' };
const MERLOT_LIGHT = {
  // pastel end: blush pinks, hue ~12, low chroma
  50: [0.975, 0.012, 14],
  100: [0.944, 0.028, 13],
  200: [0.9, 0.048, 13],
  300: [0.84, 0.068, 16],
};

// Linen neutrals: warm greys that drift from cream (#f3ebe7) to a wine-tinted near-black.
const NEUTRAL = {
  0: [1, 0, 0],
  50: [0.979, 0.0055, 55],
  100: 'ANCHOR:#f3ebe7',
  200: [0.905, 0.012, 40],
  300: [0.845, 0.015, 30],
  400: [0.73, 0.017, 20],
  500: [0.61, 0.019, 14],
  600: [0.51, 0.021, 9],
  700: [0.43, 0.023, 5],
  800: [0.345, 0.025, 2],
  900: [0.262, 0.027, 359],
  950: [0.19, 0.03, 357],
};

const lerp = (a, b, t) => a + (b - a) * t;
const lerpHue = (a, b, t) => {
  let d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

function merlot() {
  const out = {};
  for (const [step, v] of Object.entries(MERLOT_LIGHT)) out[step] = oklchToHex(v);
  for (const [step, hex] of Object.entries(MERLOT_ANCHORS)) out[step] = hex;
  const mid = (a, b, t) => {
    const [L1, C1, h1] = hexToOklch(out[a]);
    const [L2, C2, h2] = hexToOklch(out[b]);
    return oklchToHex([lerp(L1, L2, t), lerp(C1, C2, t), lerpHue(h1, h2, t)]);
  };
  out['900'] = mid('950', '800', 0.46);
  out['600'] = mid('700', '500', 0.48);
  out['400'] = mid('500', '300', 0.5);
  return Object.fromEntries(STEPS.map((s) => [s, out[s]]));
}

function family({ hue, chroma, drift }) {
  const out = {};
  STEPS.forEach((s, i) => {
    const [L, C] = LADDER[s];
    const t = i / (STEPS.length - 1); // 0 at 50, 1 at 950
    out[s] = oklchToHex([L, C * chroma, (hue + drift * t + 360) % 360]);
  });
  return out;
}

function neutral() {
  const out = {};
  for (const [s, v] of Object.entries(NEUTRAL)) {
    out[s] = typeof v === 'string' ? v.replace('ANCHOR:', '') : oklchToHex(v);
  }
  return out;
}

// Night: dark-theme surfaces derived from the base colour. Counts up from the deepest shade;
// night.2 IS the base colour. The accent tint is merlot pastel over the base. The status tints
// are each family's 900 step at 90 % over the base: a pastel at low opacity would turn every
// tint into the same red-brown on merlot, while the deep family shade keeps its hue readable.
const NIGHT = {
  0: [0.1, 0.035, 357],
  1: [0.135, 0.055, 357],
  2: 'ANCHOR:#250010',
  3: [0.205, 0.066, 357.5],
  4: [0.238, 0.064, 358],
  5: [0.275, 0.062, 359],
  6: [0.33, 0.058, 0],
  7: [0.43, 0.05, 2],
  8: [0.585, 0.044, 6],
};

function night(p) {
  const out = {};
  for (const [s, v] of Object.entries(NIGHT)) out[s] = typeof v === 'string' ? v.replace('ANCHOR:', '') : oklchToHex(v);
  const base = out['2'];
  out.accent = over(p.merlot['300'], 0.2, base);
  out.info = over(p.fjord['900'], 0.9, base);
  out.success = over(p.sage['900'], 0.9, base);
  out.warning = over(p.honey['900'], 0.9, base);
  out.danger = over(p.coral['900'], 0.9, base);
  out.feature = over(p.lilac['900'], 0.9, base);
  return out;
}

export function buildPalette() {
  const palette = { merlot: merlot() };
  for (const [name, def] of Object.entries(FAMILIES)) palette[name] = family(def);
  palette.neutral = neutral();
  palette.night = night(palette);
  return palette;
}

export const FAMILY_ROLES = {
  merlot: 'Brand, primary actions, selection, text',
  ...Object.fromEntries(Object.entries(FAMILIES).map(([k, v]) => [k, v.role])),
  neutral: 'Linen neutrals: canvas, surfaces, borders, muted text',
  night: 'Dark-theme surfaces built on the base colour (night.2 = #250010)',
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const palette = buildPalette();
  if (process.argv.includes('--write')) {
    const file = new URL('../src/tokens/tokens.json', import.meta.url);
    const tokens = JSON.parse(readFileSync(file, 'utf8'));
    const group = { $type: 'color', $description: 'Primitive colour ramps. Generated by scripts/palette.mjs — edit the generator, not these values.' };
    for (const [fam, steps] of Object.entries(palette)) {
      group[fam] = { $description: FAMILY_ROLES[fam] };
      for (const [s, hex] of Object.entries(steps)) group[fam][s] = { $value: hex };
    }
    tokens.color = group;
    writeFileSync(file, JSON.stringify(tokens, null, 2) + '\n');
    console.log('palette written to src/tokens/tokens.json');
  } else {
    for (const [fam, steps] of Object.entries(palette)) {
      console.log(fam.padEnd(8), Object.entries(steps).map(([s, h]) => `${s}:${h}`).join(' '));
    }
  }
}
