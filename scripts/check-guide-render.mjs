// Part of npm run check:render. Drives the How it works guide in a starter: auto-open, focus, chapter changes, Escape, reopen,
// reload, ?guide=0 and ?guide=present, and the phone layout. Prints GUIDE BEHAVIOUR OK.
// A prototype served over http, whose modules do not run from a file, passes its address instead:
//   node scripts/check-guide-render.mjs http://localhost:8000/ [shots folder]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './lib/files.mjs';

// Finds Playwright locally, through PLAYWRIGHT_MODULE or in the global npm folder, as check-render does.
function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = ['playwright', process.env.PLAYWRIGHT_MODULE].filter(Boolean);
  try { candidates.push(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright')); } catch { /* npm not available */ }
  for (const c of candidates) { try { return require(c); } catch { /* try next */ } }
  console.error('Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}
const { chromium } = loadPlaywright();
const args = process.argv.slice(2);
const isAddress = (s) => /^https?:\/\//i.test(s || '');
const [root = ROOT, page = 'starters/app.html', shots] = isAddress(args[0]) ? [ROOT, args[0], args[1]] : args;
const url = isAddress(page) ? page : pathToFileURL(join(root, page)).href;
/** The page with ?guide= set, keeping any query it already has. */
const withGuide = (value) => { const u = new URL(url); u.searchParams.set('guide', value); return u.href; };
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(url); await p.waitForTimeout(300);
const state = () => p.evaluate(() => {
  const d = document.querySelector('dialog.vc-guide'); const shown = [...d.querySelectorAll('.vc-guide__chapter')].filter((c) => !c.hidden);
  return { open: d.open, chapters: d.querySelectorAll('.vc-guide__chapter').length, shown: shown.map((c) => c.dataset.vcChapter), count: d.querySelector('.vc-guide__count').textContent,
    active: document.activeElement && (document.activeElement.matches('[data-vc-guide-next]') ? 'next' : document.activeElement.tagName + ':' + document.activeElement.textContent.trim().slice(0, 40)),
    back: d.querySelector('[data-vc-guide-back]').disabled, next: d.querySelector('[data-vc-guide-next]').textContent.trim(), rail: d.querySelectorAll('.vc-guide__rail .vc-step__button').length,
    current: d.querySelector('.vc-step__button[aria-current="step"]')?.textContent.trim(), live: d.querySelectorAll('[aria-live]').length };
});
let s = await state();
ok(s.open, 'does not open by itself on a fresh tab');
ok(s.shown.length === 1 && s.shown[0] === 'what', `first chapter not shown alone: ${s.shown}`);
ok(s.active === 'next', `focus not on Next at open: ${s.active}`);
ok(s.back === true, 'Back not disabled on chapter 1');
ok(s.count === `1 of ${s.chapters}`, `count reads "${s.count}"`);
ok(s.rail === s.chapters, 'rail does not list every chapter');
ok(s.live === 0, 'a live region is present');
if (shots) await p.screenshot({ path: join(shots, page.replace(/\W+/g, '_') + '-guide-1280.png') });
await p.keyboard.press('Enter'); await p.waitForTimeout(100);
s = await state();
ok(s.shown[0] === 'how', 'Next did not move to chapter 2');
ok(/^H3:/.test(s.active), `focus not on the new heading: ${s.active}`);
ok(s.back === false, 'Back still disabled on chapter 2');
ok(s.current && s.current.includes('How it works'), `rail current is ${s.current}`);
await p.click('.vc-guide__rail .vc-step__button >> nth=-1'); await p.waitForTimeout(100);
s = await state();
ok(s.shown[0] === 'present', 'rail did not jump to the last chapter');
ok(s.next === 'Start', `last chapter's button reads "${s.next}"`);
await p.keyboard.press('Escape'); await p.waitForTimeout(150);
s = await state();
ok(!s.open, 'Escape did not close the guide');
await p.click('[data-vc-guide-open]'); await p.waitForTimeout(150);
s = await state();
ok(s.open && s.shown[0] === 'what', 'header button did not reopen at chapter 1');
// Next through every chapter: the last press, on Start, closes the guide, however many chapters it has.
for (let i = 0; i < s.chapters; i++) await p.click('[data-vc-guide-next]');
await p.waitForTimeout(150);
s = await state();
ok(!s.open, 'the last button did not close the guide');
const focusAfter = await p.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-vc-guide-open'));
ok(focusAfter, 'focus did not return to the header button');
await p.reload(); await p.waitForTimeout(300);
s = await state();
ok(!s.open, 'opens again after a reload in the same tab');
const p2 = await ctx.newPage(); await p2.goto(withGuide('0')); await p2.waitForTimeout(300);
ok(!(await p2.evaluate(() => document.querySelector('dialog.vc-guide').open)), '?guide=0 did not keep it closed');
const p3 = await ctx.newPage(); await p3.goto(withGuide('present')); await p3.waitForTimeout(300);
ok(await p3.evaluate(() => { const d = document.querySelector('dialog.vc-guide'); return d.open && ![...d.querySelectorAll('.vc-guide__chapter')].find((c) => c.dataset.vcChapter === 'present').hidden; }), '?guide=present did not open at the presenting chapter');
const phone = await browser.newContext({ viewport: { width: 375, height: 760 } });
const p4 = await phone.newPage(); await p4.goto(url); await p4.waitForTimeout(300);
// Measure once the dialog has finished its 340 ms opening animation, which scales it up from 97 %;
// measured mid-animation, it came out half a pixel narrow about one run in four.
await p4.evaluate(() => Promise.all(document.querySelector('dialog.vc-guide').getAnimations().map((a) => a.finished)));
const box = await p4.evaluate(() => { const r = document.querySelector('dialog.vc-guide').getBoundingClientRect(); return [r.width, r.height, document.documentElement.scrollWidth]; });
ok(box[0] >= 374 && box[1] >= 759, `not full screen at 375 px: ${box}`);
if (shots) { await p4.screenshot({ path: join(shots, page.replace(/\W+/g, '_') + '-guide-375.png') }); }
const dark = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
const p5 = await dark.newPage(); await p5.goto(withGuide('present')); await p5.waitForTimeout(300);
if (shots) await p5.screenshot({ path: join(shots, page.replace(/\W+/g, '_') + '-guide-present-dark.png') });
ok(!errs.length, `console errors: ${errs.join(' | ')}`);
await browser.close();
if (fails.length) { console.error(fails.map((f) => '✗ ' + f).join('\n')); process.exit(1); }
console.log(`${page}: opens once per tab, focus and keyboard behave, ?guide=0 and ?guide=present work, full screen on a phone`);
console.log('GUIDE BEHAVIOUR OK');
