#!/usr/bin/env node
// Renders every documentation page and starter in Chromium (light and dark at 1280 px, light at
// 375 px and 320 px) and fails on console errors, failed requests, horizontal overflow on phones, elements
// that render as circles or pills, hexagon components without a polygon clip-path, a risk matrix or
// horizon strip that grows wider once its numbers are open, a honeycomb whose first column starts indented or
// whose cells overlap, a honeycomb that prints other columns than a wide screen shows (at A4's page area,
// 673 px), or fonts that did not load. A second pass
// at 1920 and 2560 px fails when the docs content drifts away from the sidebar, On this page runs past
// the window, the page block is off centre or anything overflows (scripts/lib/layout-probe.mjs). Needs Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, sitePages } from './lib/files.mjs';
import { wideLayoutProblems } from './lib/layout-probe.mjs';

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
  ['.vc-guide__path > li', '::before'],
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
    // The numbers behind a risk matrix or a horizon strip are measured open: an opened table must
    // scroll in its wrap, never widen its figure or the page.
    const closed = await page.evaluate(() => [...document.querySelectorAll('.vc-risk, .vc-horizon')].map((f) => Math.max(f.scrollWidth, f.clientWidth)));
    await page.evaluate(() => { for (const d of document.querySelectorAll('details.vc-risk__numbers')) d.open = true; });
    await page.waitForTimeout(60);
    renders++;
    for (const e of errors) failures.push(`${label}: ${e}`);

    const result = await page.evaluate(([HEX, closed]) => {
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
      // 4. opening a risk matrix's or a horizon strip's numbers leaves the figure as wide as it was:
      //    the table scrolls in its wrap and the grid above it stays where it was
      out.wide = [...document.querySelectorAll('.vc-risk, .vc-horizon')]
        .map((f, i) => [f, closed[i]])
        .filter(([f, before]) => f.getClientRects().length && f.scrollWidth > before + 1)
        .map(([f, before]) => `${f.tagName.toLowerCase()}.${[...f.classList].join('.')} lays out ${f.scrollWidth}px, ${before}px closed`);
      // 5. a honeycomb's first column starts at its edge, and no two of its cells overlap: in a honeycomb two
      //    cells' centres lie at least a cell's height apart (a list's indent or an odd column count with a
      //    second row breaks that)
      out.comb = [];
      for (const comb of document.querySelectorAll('.vc-honeycomb')) {
        const cells = [...comb.children].filter((c) => c.getClientRects().length).map((c) => c.getBoundingClientRect());
        if (!cells.length) continue;
        const box = comb.getBoundingClientRect();
        const indent = Math.min(...cells.map((c) => c.left)) - box.left;
        if (indent > 1) out.comb.push(`its first column starts ${Math.round(indent)}px in`);
        for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) {
          const a = cells[i]; const b = cells[j];
          const d = Math.hypot(a.left + a.width / 2 - b.left - b.width / 2, a.top + a.height / 2 - b.top - b.height / 2);
          if (d < a.height * 0.99) out.comb.push(`cells ${i + 1} and ${j + 1} overlap (centres ${Math.round(d)}px apart, cells ${Math.round(a.height)}px high)`);
        }
      }
      // 6. fonts
      out.fonts = {
        display: document.fonts.check('650 32px "Bricolage Grotesque"'),
        text: document.fonts.check('400 16px "Inter"'),
      };
      return out;
    }, [HEX_PARTS, closed]);

    if (run.width <= 375) for (const o of result.overflow) failures.push(`${label}: horizontal overflow ${o}`);
    for (const r of result.round.slice(0, 3)) failures.push(`${label}: renders round: ${r}`);
    for (const n of result.notHex.slice(0, 3)) failures.push(`${label}: not a hexagon: ${n}`);
    for (const w of result.wide.slice(0, 3)) failures.push(`${label}: its numbers widen the figure: ${w}`);
    for (const c of result.comb.slice(0, 3)) failures.push(`${label}: honeycomb: ${c}`);
    if (!result.fonts.display || !result.fonts.text) failures.push(`${label}: fonts not loaded ${JSON.stringify(result.fonts)}`);
    hexChecked += result.hex;
  }
  await context.close();
}

// Print: a page is no phone. A print dialog reports A4's page area to the media queries, 178 mm or 673 px
// between a report's margins, which is below the phone breakpoint; a honeycomb keeps the columns it lays out
// on a wide screen.
let printRenders = 0;
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const columns = () => [...document.querySelectorAll('.vc-honeycomb')].map((c) => getComputedStyle(c).gridTemplateColumns.split(' ').filter(Boolean).length);
  for (const p of pages) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ media: 'screen' });
    await page.goto(pathToFileURL(join(ROOT, p)).href, { waitUntil: 'load' });
    const wide = await page.evaluate(columns);
    if (!wide.length) continue;
    await page.setViewportSize({ width: 673, height: 1123 });
    await page.emulateMedia({ media: 'print' });
    const printed = await page.evaluate(columns);
    printRenders++;
    wide.forEach((n, i) => { if (printed[i] !== n) failures.push(`${p} [print, 673px]: honeycomb ${i + 1} prints ${printed[i]} columns, ${n} on a wide screen`); });
  }
  await context.close();
}
if (printRenders === 0) failures.push('no page with a honeycomb was printed: the print pass could not run');

// Wide screens: the docs content stays beside the sidebar inside a centred page block.
let wideRenders = 0;
for (const width of [1920, 2560]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  for (const p of pages) {
    await page.goto(pathToFileURL(join(ROOT, p)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    wideRenders++;
    for (const problem of await page.evaluate(wideLayoutProblems)) failures.push(`${p} [${width}px]: ${problem}`);
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
console.log(`${renders} renders (${pages.length} pages × light, dark, 375 px, 320 px): no console errors, no failed requests, no phone overflow; opening the numbers widens no risk matrix or horizon strip; every honeycomb starts at its edge with no cell over another.`);
console.log(`${hexChecked} rendered hexagon parts compute a polygon clip-path; nothing renders as a circle or pill; fonts loaded.`);
console.log(`${printRenders} pages with a honeycomb printed at 673 px: every comb keeps the columns it has on a wide screen.`);
console.log(`${wideRenders} wide renders (${pages.length} pages × 1920 and 2560 px): the content sits beside the sidebar, On this page fits, the page block is centred.`);
console.log('RENDER OK');
