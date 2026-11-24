#!/usr/bin/env node
// A dialog keeps still when the system asks for reduced motion, and a dialog's scrolling body shows the
// keyboard's focus. Renders the Overlays page in Chromium at 1280 × 720 and:
//   - opens the demo dialog with reduced motion and fails when an animation or transition of a millisecond or
//     more runs: on the dialog, its backdrop or anything in it (a spinner's slow sweep excepted, as the
//     Motion guideline says);
//   - opens a dialog with a close button and a body that holds only text, longer than the dialog, so
//     Chromium makes the body focusable; Tabs to it and fails unless its ring shows all round: along the
//     body's left side, just inside the edge the dialog clips, the body must look different focused than not.
// Self-tests: without reduced motion the dialog's entrance must be seen moving, and with the ring moved back
// outside the edge, where the dialog cuts off all but its top, the left side must be caught unchanged, so the
// check can fail. Needs Playwright with
// Chromium: `npm i -D playwright && npx playwright install chromium`.
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
const url = pathToFileURL(join(ROOT, 'components/overlays.html')).href;
const failures = [];

/** What moves now: animations and transitions of a millisecond or more, a spinner's sweep apart. */
const moving = (page) => page.evaluate(() => document.getAnimations()
  .filter((a) => a.playState === 'running' || a.playState === 'pending')
  .filter((a) => (a.effect?.getComputedTiming?.().duration || 0) >= 1 && !a.effect?.target?.closest?.('.vc-spinner'))
  .map((a) => `${a.animationName || a.transitionProperty} on ${a.effect?.target?.id || a.effect?.target?.className}${a.effect?.pseudoElement || ''}`));

async function openDemo(reducedMotion) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.getElementById('demo-dialog').showModal());
  const seen = new Set();
  for (const wait of [0, 40, 160]) {
    if (wait) await page.waitForTimeout(wait);
    for (const m of await moving(page)) seen.add(m);
  }
  await page.close();
  return [...seen];
}

// ---- reduced motion: nothing moves, the backdrop included ---------------------------------------------------
const still = await openDemo('reduce');
if (still.length) failures.push(`with reduced motion the dialog still moves: ${still.join('; ')}`);
const moves = await openDemo('no-preference');
if (!moves.length) failures.push('self-test: without reduced motion the dialog\'s entrance was not seen moving, so the motion check proves nothing');

// ---- focus: a scrolling body shows the keyboard's focus ------------------------------------------------------
async function bodyFocus({ ringOutside = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate((outside) => {
    const d = document.createElement('dialog');
    d.className = 'vc-dialog';
    d.id = 'check-dialog';
    d.setAttribute('aria-labelledby', 'check-dialog-title');
    const header = document.createElement('header');
    header.className = 'vc-dialog__header';
    const h = document.createElement('h2');
    h.className = 'vc-dialog__title';
    h.id = 'check-dialog-title';
    h.textContent = 'Method';
    // A close button, as Vici's dialogs carry: the dialog opens with the focus on it, and Tab moves on to the
    // body, as a person's keyboard does.
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'vc-icon-button';
    close.setAttribute('aria-label', 'Close');
    const x = document.createElement('span');
    x.className = 'vc-icon vc-icon--close';
    x.setAttribute('aria-hidden', 'true');
    close.append(x);
    header.append(h, close);
    const body = document.createElement('div');
    body.className = 'vc-dialog__body';
    for (let i = 0; i < 30; i += 1) {
      const p = document.createElement('p');
      p.textContent = 'The engine works out every figure from the ratings the agents give, by the rules below.';
      body.append(p);
    }
    if (outside) body.style.setProperty('outline-offset', '2px', 'important');
    d.append(header, body);
    document.body.append(d);
    d.showModal();
  }, ringOutside);
  let onBody = false;
  for (let i = 0; i < 6 && !onBody; i += 1) {
    await page.keyboard.press('Tab');
    onBody = await page.evaluate(() => document.activeElement?.classList.contains('vc-dialog__body'));
  }
  if (!onBody) { await page.close(); return { onBody: false }; }
  // Measure once the entrance has run. With reduced motion it lasts 0.01 ms, but only from the next frame
  // drawn: measured before that, the dialog still sits at its starting scale, and the strip below misses the
  // ring by the few pixels the dialog then grows.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  await page.waitForTimeout(120);
  const r = await page.evaluate(() => {
    const e = document.activeElement;
    const b = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return { x: b.left, y: b.top, w: b.width, h: b.height, visible: e.matches(':focus-visible'),
      outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}, offset ${cs.outlineOffset}` };
  });
  // The body's left side, inside the dialog: a ring drawn outside the body is cut off here.
  const clip = { x: Math.ceil(r.x), y: Math.ceil(r.y + 12), width: 8, height: Math.max(8, Math.min(720 - Math.ceil(r.y + 12), Math.floor(r.h - 24))) };
  const on = await page.screenshot({ clip, animations: 'disabled' });
  await page.evaluate(() => { window.__body = document.activeElement; document.activeElement.blur(); });
  const off = await page.screenshot({ clip, animations: 'disabled' });
  await page.close();
  return { onBody: true, shows: !on.equals(off), why: `:focus-visible ${r.visible ? 'matched' : 'did not match'}; outline ${r.outline}; body at ${Math.round(r.x)}, ${Math.round(r.y)}, ${Math.round(r.w)} × ${Math.round(r.h)} px` };
}
const focus = await bodyFocus();
if (!focus.onBody) failures.push('Tab never reached the scrolling body of a dialog that holds only text');
else if (!focus.shows) failures.push(`a dialog's scrolling body does not show its focus ring along its side (${focus.why}; Chromium ${browser.version()})`);
const planted = await bodyFocus({ ringOutside: true });
if (planted.onBody && planted.shows) failures.push('self-test: a ring outside the body\'s edge was not caught along its side, so the focus check proves nothing');

await browser.close();
if (failures.length) {
  console.error(failures.map((f) => `FAIL  ${f}`).join('\n'));
  process.exit(1);
}
console.log(`With reduced motion an open dialog keeps still, backdrop included (without it, ${moves.length} animation${moves.length === 1 ? '' : 's'} ran); a scrolling body that holds only text takes the focus and shows its ring all round, inside the dialog's edge, and a ring outside it is caught.`);
console.log('DIALOG RENDER OK');
