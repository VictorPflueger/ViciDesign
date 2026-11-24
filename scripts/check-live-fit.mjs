#!/usr/bin/env node
// The live-run dialog shows every part without scrolling at 1280 × 720 and 1920 × 1080, the estimate too, until a
// warning appears. Renders the Overlays page in Chromium, opens the demo with research and Advanced but no warning
// (a real dialog shows one only when the page finds something private), and fails when the body has to scroll or
// when the box, the estimate or the start button lies outside the dialog's visible area. A self-test shows the
// warning and expects the body to scroll at 1280 × 720, so the check can fail. Needs Playwright with Chromium:
// `npm i -D playwright && npx playwright install chromium`.
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
const browser = await chromium.launch();
const url = pathToFileURL(join(ROOT, 'components/overlays.html')).href;

async function measure(width, height, scheme, warning) {
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: scheme });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const m = await page.evaluate((warning) => {
    const dialog = document.getElementById('demo-live');
    dialog.querySelector('.vc-live__warning').hidden = !warning;
    dialog.showModal();
    const body = dialog.querySelector('.vc-live__body');
    const box = body.getBoundingClientRect();
    const seen = (sel) => {
      const r = dialog.querySelector(sel).getBoundingClientRect();
      const area = sel === '.vc-live__start' ? dialog.getBoundingClientRect() : box;
      return r.height > 0 && r.top >= area.top - 0.5 && r.bottom <= area.bottom + 0.5;
    };
    return {
      overflow: Math.round(body.scrollHeight - body.clientHeight),
      parts: ['.vc-live__ack', '.vc-live__estimate', '.vc-live__start'].filter((s) => !seen(s)),
    };
  }, warning);
  await page.close();
  return m;
}

const failures = [];
let checked = 0;
for (const [width, height] of [[1280, 720], [1920, 1080]]) {
  for (const scheme of ['light', 'dark']) {
    const m = await measure(width, height, scheme, false);
    checked += 1;
    if (m.overflow > 0) failures.push(`${width} × ${height}, ${scheme}: with no warning the body scrolls by ${m.overflow} px`);
    for (const p of m.parts) failures.push(`${width} × ${height}, ${scheme}: ${p} lies outside the dialog's visible area`);
  }
}
// Self-test: with the warning the parts no longer fit at 1280 × 720, so the body scrolls and the footer stays.
const control = await measure(1280, 720, 'light', true);
if (control.overflow <= 0) failures.push('self-test: with the warning shown at 1280 × 720 the body should scroll, and it does not');
if (control.parts.includes('.vc-live__start')) failures.push('self-test: with the warning shown the start button left the footer');
await browser.close();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${checked} renders: with no warning the live-run dialog shows the box, the estimate and the start button without scrolling at 1280 × 720 and 1920 × 1080; with a warning the body scrolls and the footer stays.\nLIVE DIALOG FIT OK`);
