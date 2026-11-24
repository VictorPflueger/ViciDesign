#!/usr/bin/env node
// Every target is at least 40 px each way (Layout, Density): renders the pages that show the controls drawn
// smaller than their target in Chromium at 1280 × 720 and fails when one takes less:
//   - a segmented control's option, whose radio covers the option and the control's padding around it;
//   - a switch's label, which reaches above and below its track;
//   - a slider, whose box is centred on its thumb;
//   - the summary that opens the numbers behind a risk matrix or a horizon strip;
// in the light and the dark scheme. The small size (--sm modifiers, 32 px) is left out, as Density allows it
// on data-heavy screens. Self-test: the same controls with their reach taken away must be caught, so the
// check can fail. Needs Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`.
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
const browser = await chromium.launch(process.getuid?.() === 0 ? { args: ['--no-sandbox'] } : {});
const PAGES = ['components/actions.html', 'components/forms.html', 'components/data.html', 'components/overlays.html'];
const TARGETS = [
  ['a segmented option', '.vc-segmented:not([class*="--sm"]) input'],
  ['a switch', '.vc-switch:not([class*="--sm"])'],
  ['a slider', '.vc-slider:not([class*="--sm"])'],
  ['the numbers\' summary', '.vc-risk__numbers > summary'],
];
const failures = [];
const counts = Object.fromEntries(TARGETS.map(([name]) => [name, 0]));

async function measure(file, scheme, { reach = true } = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, colorScheme: scheme, reducedMotion: 'reduce' });
  await page.goto(pathToFileURL(join(ROOT, file)).href, { waitUntil: 'load' });
  if (!reach) {
    // Self-test: take the reach away, as the controls were drawn before.
    await page.evaluate(() => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync('.vc-segmented input { inset: 0 !important } .vc-switch { padding-block: 0 !important; margin-block: 0 !important } .vc-slider { height: 28px !important; margin: 0 !important } .vc-risk__numbers > summary { padding-block: 0 !important; margin-block: 0 !important }');
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    });
  }
  // Open the live-run dialog the page demonstrates, so its controls render.
  await page.evaluate(() => document.querySelector('dialog.vc-live')?.showModal?.());
  await page.waitForTimeout(150);
  const found = await page.evaluate((targets) => targets.map(([name, sel]) => [name, [...document.querySelectorAll(sel)]
    .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && el.closest('dialog:not([open])') === null && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden]'); })
    .map((el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height, label: (el.closest('label')?.textContent || el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30) }; })]), TARGETS);
  await page.close();
  return found;
}

const small = [];
for (const file of PAGES) {
  for (const scheme of ['light', 'dark']) {
    for (const [name, list] of await measure(file, scheme)) {
      counts[name] += list.length;
      for (const x of list) if (x.w < 39.5 || x.h < 39.5) small.push(`${file} ${scheme}: ${name} "${x.label}" ${Math.round(x.w)} × ${Math.round(x.h)} px`);
    }
  }
}
if (small.length) failures.push(...small.map((s) => `under 40 px: ${s}`));
for (const [name, n] of Object.entries(counts)) if (!n) failures.push(`found no ${name} to measure on ${PAGES.join(', ')}`);

// Self-test: without their reach, the controls must be caught.
const planted = [];
for (const file of PAGES) for (const [name, list] of await measure(file, 'light', { reach: false })) for (const x of list) if (x.h < 39.5) planted.push(name);
const caught = new Set(planted);
for (const [name] of TARGETS) if (!caught.has(name)) failures.push(`self-test: ${name} without its reach was not caught, so the check proves nothing for it`);

await browser.close();
if (failures.length) {
  console.error(failures.map((f) => `FAIL  ${f}`).join('\n'));
  process.exit(1);
}
console.log(`${Object.entries(counts).map(([name, n]) => `${n} × ${name}`).join(', ')}, light and dark: every target at least 40 px each way; without their reach, all four kinds are caught.`);
console.log('TARGETS OK');
