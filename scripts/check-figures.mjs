#!/usr/bin/env node
// Tabular figures belong in number cells only. Inter's tabular figures also give the hyphen a figure's width,
// so a text cell that sets them reads "person - days". Renders the Data display page in Chromium, puts a text
// cell and a number cell into a .vc-table and into a classless table, and fails when the text cell sets a
// hyphenated word wider than the same word in a paragraph, or when the number cell's figures are not all the
// same width. Needs Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`.
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
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(pathToFileURL(join(ROOT, 'components/data.html')).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const found = await page.evaluate(() => {
  const WORD = 'Build effort in person-days';
  // The width of a text set in its own span inside an element, so padding and the cell's width don't count.
  const width = (el, text) => {
    const s = document.createElement('span');
    s.style.whiteSpace = 'pre';
    s.textContent = text;
    el.replaceChildren(s);
    return s.getBoundingClientRect().width;
  };
  const out = [];
  for (const cls of ['vc-table', '']) {
    const table = document.createElement('table');
    if (cls) table.className = cls;
    table.innerHTML = '<tbody><tr><td></td><td class="vc-num"></td></tr><tr><td></td><td class="vc-num"></td></tr></tbody>';
    document.body.append(table);
    const [text, ones] = table.querySelectorAll('tr:first-child td');
    const eights = table.querySelector('tr:last-child td.vc-num');
    // A paragraph in the cell's own font and size: only the figures' setting can make the cell wider.
    const cs = getComputedStyle(text);
    const p = document.createElement('p');
    Object.assign(p.style, { fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, letterSpacing: cs.letterSpacing, fontVariantNumeric: 'normal' });
    document.body.append(p);
    out.push({ table: cls ? '.vc-table' : 'a classless table', text: width(text, WORD), p: width(p, WORD), ones: width(ones, '111'), eights: width(eights, '888') });
    table.remove();
    p.remove();
  }
  return out;
});
await browser.close();

const failures = [];
for (const f of found) {
  if (Math.abs(f.text - f.p) > 0.25) failures.push(`${f.table}: a text cell sets "Build effort in person-days" ${f.text.toFixed(2)} px wide, a paragraph ${f.p.toFixed(2)} px`);
  if (Math.abs(f.ones - f.eights) > 0.25) failures.push(`${f.table}: a number cell sets "111" ${f.ones.toFixed(2)} px and "888" ${f.eights.toFixed(2)} px wide`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${found.length} tables: text cells set their words as a paragraph does, and number cells' figures all share one width.\nTABLE FIGURES OK`);
