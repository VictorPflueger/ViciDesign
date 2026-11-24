#!/usr/bin/env node
// A callout stays pastel in both themes, so every text and surface token its content may use has to follow
// the callout's ink rather than the page theme: a token left to the page turns pale on the pastel in the
// dark theme and the text on it vanishes. Renders the Feedback page in the light theme, the dark theme the
// system asks for and the dark theme the toggle sets, puts a probe into a callout of every tone, and fails
// when a text token falls below the ratio Vici's token check asks for on the page (text 7:1, muted, subtle
// and on-accent-soft text 4.5:1, strong borders and focus rings 3:1) on a surface token inside the callout.
// Needs Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './lib/files.mjs';

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = ['playwright', process.env.PLAYWRIGHT_MODULE].filter(Boolean);
  try {
    candidates.push(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright'));
  } catch { /* npm not available */ }
  for (const c of candidates) {
    try { return require(c); } catch { /* try next */ }
  }
  console.error('Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const { chromium } = loadPlaywright();

const TONES = ['', 'vc-callout--tip', 'vc-callout--note', 'vc-callout--caution', 'vc-callout--ai'];
// [foreground token, surface tokens inside the callout, minimum ratio]; "tone" is the callout itself.
const RULES = [
  ['--vc-text', ['tone', '--vc-bg', '--vc-bg-subtle', '--vc-surface', '--vc-surface-raised', '--vc-surface-hover'], 7],
  ['--vc-text-muted', ['tone', '--vc-bg', '--vc-bg-subtle', '--vc-surface', '--vc-surface-raised', '--vc-surface-hover'], 4.5],
  ['--vc-text-subtle', ['tone', '--vc-bg', '--vc-surface', '--vc-surface-raised'], 4.5],
  ['--vc-on-accent-soft', ['tone', '--vc-bg', '--vc-surface'], 4.5],
  ['--vc-border-strong', ['tone', '--vc-bg', '--vc-surface', '--vc-surface-raised'], 3],
  ['--vc-focus', ['tone', '--vc-bg', '--vc-bg-subtle', '--vc-surface', '--vc-surface-raised'], 3],
];
const RUNS = [
  { label: 'light', scheme: 'light', attr: null },
  { label: 'dark (system)', scheme: 'dark', attr: null },
  { label: 'dark (toggle)', scheme: 'light', attr: 'dark' },
];

const browser = await chromium.launch();
const failures = [];
let pairs = 0;
let lowest = Infinity;
for (const run of RUNS) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: run.scheme });
  const page = await context.newPage();
  await page.goto(pathToFileURL(join(ROOT, 'components/feedback.html')).href, { waitUntil: 'load' });
  const found = await page.evaluate(([TONES, RULES, attr]) => {
    if (attr) document.documentElement.setAttribute('data-theme', attr);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const g = canvas.getContext('2d', { willReadFrequently: true });
    const rgb = (c) => { g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = c; g.fillRect(0, 0, 1, 1); return [...g.getImageData(0, 0, 1, 1).data]; };
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = ([r, gr, b]) => 0.2126 * lin(r) + 0.7152 * lin(gr) + 0.0722 * lin(b);
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const out = [];
    for (const tone of TONES) {
      const box = document.createElement('div');
      box.className = `vc-callout ${tone}`.trim();
      document.body.append(box);
      const toneColour = rgb(getComputedStyle(box).backgroundColor);
      const probe = document.createElement('span');
      box.append(probe);
      for (const [fg, surfaces, min] of RULES) {
        probe.style.color = `var(${fg})`;
        const ink = rgb(getComputedStyle(probe).color);
        for (const s of surfaces) {
          probe.style.backgroundColor = s === 'tone' ? '' : `var(${s})`;
          const bg = s === 'tone' ? toneColour : rgb(getComputedStyle(probe).backgroundColor);
          out.push({ tone: tone || 'vc-callout', fg, bg: s, min, ratio: ratio(ink, bg) });
        }
      }
      box.remove();
    }
    return out;
  }, [TONES, RULES, run.attr]);
  for (const f of found) {
    pairs += 1;
    lowest = Math.min(lowest, f.ratio);
    if (f.ratio < f.min) failures.push(`${run.label}: ${f.fg} on ${f.bg === 'tone' ? 'the tone' : f.bg} in .${f.tone} is ${f.ratio.toFixed(2)}:1, needs ${f.min}:1`);
  }
  await context.close();
}
await browser.close();

if (failures.length) {
  console.error(`${failures.length} of ${pairs} pairs fall short:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log(`${pairs} pairs in ${TONES.length} callout tones and ${RUNS.length} themes, the lowest at ${lowest.toFixed(2)}:1.\nCALLOUT INK OK`);
