#!/usr/bin/env node
// Reduced motion stops every animation but the spinner's slow sweep (guidelines/motion.html). Renders the
// Overlays page in Chromium with reduced motion asked for, opens each of its dialogs with showModal(), and
// fails when an animation or transition lasts longer than an instant, on the dialog, on anything in it or on
// its backdrop, which no `*` selector reaches. A self-test opens the same dialogs without reduced motion and
// expects the dialog and its backdrop to animate, so the check can fail. Needs Playwright with Chromium:
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

/** Opens every dialog of the page in turn and lists the animations longer than 1 ms, spinners apart. */
async function probe(reducedMotion) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const found = await page.evaluate(async () => {
    const out = [];
    for (const dialog of document.querySelectorAll('dialog.vc-dialog')) {
      dialog.showModal();
      await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
      for (const a of document.getAnimations()) {
        const t = a.effect?.getComputedTiming?.();
        const target = a.effect?.target;
        if (!t || typeof t.duration !== 'number' || t.duration <= 1 || target?.closest?.('.vc-spinner')) continue;
        out.push(`#${dialog.id}: ${a.animationName || a.transitionProperty} on ${target === dialog ? 'the dialog' : target?.tagName?.toLowerCase()}${a.effect.pseudoElement || ''}, ${Math.round(t.duration)} ms`);
      }
      dialog.close();
    }
    return out;
  });
  await page.close();
  return [...new Set(found)];
}

const failures = [];
const reduced = await probe('reduce');
for (const f of reduced) failures.push(`with reduced motion, ${f}`);
const full = await probe('no-preference');
if (!full.some((f) => f.includes('::backdrop')) || !full.some((f) => f.includes('the dialog'))) failures.push(`self-test: without reduced motion a dialog and its backdrop should animate, and the probe found ${full.length ? full.slice(0, 3).join('; ') : 'nothing'}`);
await browser.close();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`With reduced motion nothing moves when the Overlays page's dialogs open, their backdrops included; without it the probe finds ${full.length} animations.\nREDUCED MOTION OK`);
