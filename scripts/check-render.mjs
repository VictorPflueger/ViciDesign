#!/usr/bin/env node
// Renders every documentation page and starter in Chromium (light and dark at 1280 px, light at
// 375 px and 320 px) and fails on console errors, failed requests, horizontal overflow on phones, elements
// that render as circles or pills, hexagon components without a polygon clip-path, or fonts that
// did not load. Needs Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, sitePages } from './lib/files.mjs';

// Finds Playwright locally, through PLAYWRIGHT_MODULE or in the global npm folder
// (the same helper as in VictorPflueger/PROC-Rebate-Hunter's test harness).
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

// [selector, pseudo-element] pairs that must compute to a polygon clip-path wherever they appear
const HEX_PARTS = [
  ['.vc-avatar', null], ['.vc-radio > input', null], ['.vc-switch > input', null], ['.vc-switch', '::after'],
  ['.vc-badge', '::after'], ['.vc-presence', '::after'], ['.vc-spinner', null], ['.vc-progress-hex', '::before'],
  ['.vc-progress', null], ['.vc-icon-button', '::before'], ['.vc-pagination__page', '::before'], ['.vc-step__marker', '::before'],
  ['.vc-carousel__dots > button', '::before'], ['.vc-rating > label', '::before'], ['.vc-timeline > li', '::after'],
  ['.vc-legend > li', '::before'], ['.vc-chip', '::before'], ['.vc-tag', '::before'], ['.vc-cell', null], ['.vc-tile', null],
];

const pages = sitePages();
const failures = [];
let hexChecked = 0;
let renders = 0;

const browser = await chromium.launch();
const runs = [
  { width: 1280, scheme: 'light' },
  { width: 1280, scheme: 'dark' },
  { width: 375, scheme: 'light' },
  { width: 320, scheme: 'light' },   // WCAG 1.4.10 reflow: 320 CSS px without sideways scrolling
];

for (const run of runs) {
  const context = await browser.newContext({ viewport: { width: run.width, height: 900 }, colorScheme: run.scheme });
  const page = await context.newPage();
  let errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));

  for (const p of pages) {
    errors = [];
    const label = `${p} [${run.scheme} ${run.width}px]`;
    await page.goto(pathToFileURL(join(ROOT, p)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(60);
    renders++;
    for (const e of errors) failures.push(`${label}: ${e}`);

    const result = await page.evaluate((HEX) => {
      const out = { overflow: [], round: [], hex: 0, notHex: [], fonts: {} };
      // 1. horizontal overflow on narrow screens (ignore content inside scroll containers)
      const vw = document.documentElement.clientWidth;
      const scrollsX = (el) => {
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const o = getComputedStyle(a).overflowX;
          if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true;
        }
        return false;
      };
      if (document.documentElement.scrollWidth > vw + 1) {
        for (const el of document.body.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width && r.right > vw + 1 && !scrollsX(el) && getComputedStyle(el).position !== 'fixed') {
            out.overflow.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} → ${Math.round(r.right)}px`);
            if (out.overflow.length > 4) break;
          }
        }
        if (!out.overflow.length) out.overflow.push(`document scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
      }
      // 2. nothing renders as a circle or pill
      for (const el of document.querySelectorAll('body *')) {
        if (el instanceof SVGElement) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        const min = Math.min(r.width, r.height);
        if (min < 6) continue;
        const radius = Math.max(...['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'].map((k) => parseFloat(cs[k]) || 0));
        const visible = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0 || cs.backgroundImage !== 'none';
        if (visible && radius >= 0.45 * min) out.round.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} (radius ${radius}px on ${Math.round(r.width)}×${Math.round(r.height)})`);
      }
      // 3. hexagon parts compute a polygon
      for (const [sel, pseudo] of HEX) {
        for (const el of document.querySelectorAll(sel)) {
          const cp = getComputedStyle(el, pseudo).clipPath;
          if (/polygon/.test(cp)) out.hex++;
          else out.notHex.push(`${sel}${pseudo || ''} → ${cp}`);
        }
      }
      // 4. fonts
      out.fonts = {
        display: document.fonts.check('650 32px "Bricolage Grotesque"'),
        text: document.fonts.check('400 16px "Inter"'),
      };
      return out;
    }, HEX_PARTS);

    if (run.width <= 375) for (const o of result.overflow) failures.push(`${label}: horizontal overflow ${o}`);
    for (const r of result.round.slice(0, 3)) failures.push(`${label}: renders round: ${r}`);
    for (const n of result.notHex.slice(0, 3)) failures.push(`${label}: not a hexagon: ${n}`);
    if (!result.fonts.display || !result.fonts.text) failures.push(`${label}: fonts not loaded ${JSON.stringify(result.fonts)}`);
    hexChecked += result.hex;
  }
  await context.close();
}
await browser.close();

if (failures.length) {
  console.error(failures.slice(0, 60).map((f) => '✗ ' + f).join('\n'));
  console.error(`\n${failures.length} rendering problem(s)`);
  process.exit(1);
}
if (hexChecked === 0) {
  console.error('No hexagon components found on any page — the check could not run.');
  process.exit(1);
}
console.log(`${renders} renders (${pages.length} pages × light, dark, 375 px, 320 px): no console errors, no failed requests, no phone overflow.`);
console.log(`${hexChecked} rendered hexagon parts compute a polygon clip-path; nothing renders as a circle or pill; fonts loaded.`);
console.log('RENDER OK');
