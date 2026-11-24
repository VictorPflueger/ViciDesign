#!/usr/bin/env node
// A report prints alone with its footer on every page, and leaves as a file of its own that loads nothing.
// Serves the site on a local port, opens the Report page in Chromium and:
//   - checks that the sheets stay light in the dark theme and that the print copy stays hidden on screen;
//   - prints the example through Vici.report.prepare() and reads the PDF: every page carries the footer's
//     start, "page i of n" and, when the report has a notice, the notice, and none carries the fixed footer
//     as well; removing the copy takes the footer's words off the root again;
//   - opens the file from Vici.report.html() with scripts off and the network shut, and fails when it asks
//     for anything, holds a script or a web font, or loses the report's look; then prints it and finds the
//     footer on every page there too.
// Self-tests: a report without the footer's words must fail the footer test, and the bare markup without the
// file's styles must fail the look test. Needs Playwright with Chromium: `npm i -D playwright && npx playwright
// install chromium`.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { ROOT } from './lib/files.mjs';
import { pdfPageTexts } from './lib/pdf.mjs';

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

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = join(ROOT, path.endsWith('/') ? `${path}index.html` : path);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/components/report.html`;

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const failures = [];
const squeeze = (s) => String(s).replace(/\s+/g, '').normalize('NFC');
const START = squeeze('Created with PESTEL Challenger\nhttps://victorpflueger.github.io/PESTEL-challenger/');
const NOTICE = 'Stopped at the budget cap: this report is incomplete.';

/** What each printed page says about its footer: the start, its own number of the count, the notice. */
function footerOf(pdf, { notice = '', fixed = '' } = {}) {
  const pages = pdfPageTexts(pdf).map(squeeze);
  const n = pages.length;
  const problems = [];
  if (n < 3) problems.push(`the example printed on ${n} page(s), expected 3 or more`);
  pages.forEach((text, i) => {
    const count = text.split(START).length - 1;
    if (count !== 1) problems.push(`page ${i + 1} of ${n} shows the footer's start ${count} times`);
    if (!text.includes(squeeze(`Built by Victor Pflüger · page ${i + 1} of ${n}`))) problems.push(`page ${i + 1} of ${n} lacks "Built by Victor Pflüger · page ${i + 1} of ${n}"`);
    if (notice && !text.includes(squeeze(notice))) problems.push(`page ${i + 1} of ${n} lacks the notice`);
    if (fixed && text.includes(squeeze(fixed))) problems.push(`page ${i + 1} of ${n} prints the fixed footer beside the margin boxes`);
  });
  return { pages: n, problems };
}

const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, colorScheme: 'dark' });
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
if (!(await page.evaluate(() => !!(window.Vici && Vici.report && document.getElementById('demo-report'))))) {
  console.error('components/report.html: no Vici.report or no #demo-report');
  await browser.close();
  server.close();
  process.exit(1);
}

// On screen: light sheets in the dark theme, and a print copy that stays out of sight.
const screen = await page.evaluate(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
  const report = document.getElementById('demo-report');
  const sheet = report.querySelector('.vc-report__page');
  const title = report.querySelector('.vc-report__title');
  const undo = Vici.report.prepare(report);
  const box = document.querySelector('body > [data-vc-print]');
  const root = getComputedStyle(document.documentElement);
  const out = {
    pageBg: getComputedStyle(document.body).backgroundColor,
    sheetBg: getComputedStyle(sheet).backgroundColor,
    titleColor: getComputedStyle(title).color,
    copyShown: box ? getComputedStyle(box).display !== 'none' : null,
    copyIds: box ? box.querySelectorAll('[id$="-print"]').length : 0,
    marked: box ? box.hasAttribute('data-vc-margin-boxes') : false,
    words: root.getPropertyValue('--vc-report-footer-start').trim(),
  };
  undo();
  out.copyLeft = !!document.querySelector('[data-vc-print]');
  out.wordsLeft = getComputedStyle(document.documentElement).getPropertyValue('--vc-report-footer-start').trim();
  document.documentElement.removeAttribute('data-theme');
  return out;
});
if (screen.sheetBg !== 'rgb(255, 255, 255)') failures.push(`in the dark theme a sheet is ${screen.sheetBg}, not white`);
if (screen.titleColor !== 'rgb(37, 0, 16)') failures.push(`in the dark theme the title is ${screen.titleColor}, not merlot`);
if (screen.pageBg === 'rgb(255, 255, 255)') failures.push('self-test: the dark theme did not take, so the light sheets prove nothing');
if (screen.copyShown !== false) failures.push(screen.copyShown === null ? 'Vici.report.prepare() made no copy at the end of body' : 'the print copy shows on screen');
if (!screen.copyIds) failures.push('the print copy kept the report\'s ids without a suffix');
if (!screen.marked) failures.push('in Chromium the print copy is not marked data-vc-margin-boxes');
if (!screen.words.startsWith('"Created with PESTEL Challenger')) failures.push(`the footer's words did not reach the root: ${screen.words || 'nothing'}`);
if (screen.copyLeft || screen.wordsLeft) failures.push('the function Vici.report.prepare() returned left the copy or the footer\'s words behind');

// In print nothing paints behind the pages: the report's ground stays on screen.
await page.evaluate(() => { window.__undo = Vici.report.prepare(document.getElementById('demo-report')); });
await page.emulateMedia({ media: 'print' });
const ground = await page.evaluate(() => [...document.querySelectorAll('body > [data-vc-print], body > [data-vc-print] .vc-report, body > [data-vc-print] .vc-report__page')]
  .map((el) => getComputedStyle(el).backgroundColor).filter((c) => c !== 'rgba(0, 0, 0, 0)' && c !== 'rgb(255, 255, 255)'));
await page.emulateMedia({ media: null });
await page.evaluate(() => window.__undo());
if (ground.length) failures.push(`in print something paints behind the pages: ${ground.join(', ')}`);

// In print: the footer on every page, with the notice when there is one, and the fixed footer hidden.
const fixed = await page.evaluate(() => document.querySelector('#demo-report .vc-report__footer').textContent);
async function printed(prepare) {
  await page.evaluate(prepare);
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  await page.evaluate(() => window.__undo());
  return pdf;
}
const plain = footerOf(await printed(() => { window.__undo = Vici.report.prepare(document.getElementById('demo-report')); }), { fixed });
failures.push(...plain.problems);
const noticed = footerOf(await printed(() => {
  const r = document.getElementById('demo-report');
  r.setAttribute('data-vc-notice', 'Stopped at the budget cap: this report is incomplete.');
  window.__undo = Vici.report.prepare(r);
  r.removeAttribute('data-vc-notice');
}), { notice: NOTICE, fixed });
failures.push(...noticed.problems.map((p) => `with a notice: ${p}`));
// Chromium 131 to 147 cannot answer @supports at-rule(): without that rule, the copy's own mark must still
// keep the fixed footer from printing beside the margin boxes.
const unasked = footerOf(await printed(() => {
  const drop = (list, owner) => {
    for (let i = list.length - 1; i >= 0; i--) {
      const rule = list[i];
      if (rule instanceof CSSSupportsRule && /at-rule\(/.test(rule.conditionText)) { owner.deleteRule(i); window.__dropped = (window.__dropped || 0) + 1; }
      else if (rule.cssRules) drop(rule.cssRules, rule);
    }
  };
  for (const sheet of document.styleSheets) { try { drop(sheet.cssRules, sheet); } catch { /* another origin */ } }
  window.__undo = Vici.report.prepare(document.getElementById('demo-report'));
}), { fixed });
failures.push(...unasked.problems.map((p) => `without @supports at-rule(): ${p}`));
if (!(await page.evaluate(() => window.__dropped)) && (await page.evaluate(() => CSS.supports('at-rule(@bottom-left)')))) failures.push('self-test: found no @supports at-rule() rule to take away');
await page.reload({ waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const bare = footerOf(await printed(() => {
  const r = document.getElementById('demo-report').cloneNode(true);
  r.id = 'demo-report-bare';
  for (const a of ['data-vc-footer-start', 'data-vc-footer-end', 'data-vc-footer-of']) r.removeAttribute(a);
  document.body.appendChild(r);
  window.__undo = Vici.report.prepare(r);
  r.remove();
}));
if (!bare.problems.length) failures.push('self-test: a report without the footer\'s words passed the footer test');

// A file of its own: loads nothing, keeps the look, prints with the footer.
const made = await page.evaluate(() => {
  const r = document.getElementById('demo-report');
  const look = (el) => { const s = getComputedStyle(el); return [s.fontSize, s.fontWeight, s.color, s.backgroundColor].join(' '); };
  return {
    file: Vici.report.html(r),
    bareMarkup: r.outerHTML,
    look: {
      title: look(r.querySelector('.vc-report__title')),
      tag: look(r.querySelector('.vc-tag--feature')),
      cell: look(r.querySelector('.vc-report__brand .vc-cell')),
      table: look(r.querySelector('.vc-table th')),
    },
  };
});
const file = made.file;
const kb = Math.round(Buffer.byteLength(file) / 1024);
if (!file.startsWith('<!DOCTYPE html>')) failures.push('the file does not start with <!DOCTYPE html>');
if (!/http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"/.test(file)) failures.push('the file lacks its policy that loads nothing');
if (/<script\b/i.test(file)) failures.push('the file holds a script');
if (/@font-face/i.test(file)) failures.push('the file holds a web font rule');
if (/data-vc-print/.test(file)) failures.push('the file holds the print copy\'s rules');
if (kb > 160) failures.push(`the file weighs ${kb} KB; keep it under 160 KB`);
const images = [...file.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
if (!images.length) failures.push('the file lost the byline\'s pictures');
for (const img of images) if (!/\ssrc="data:image\//.test(img)) failures.push(`a picture in the file is not data: ${img.slice(0, 80)}`);

const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 720 } });
const asked = [];
await ctx.route('**/*', (route) => { asked.push(route.request().url()); route.abort(); });
async function openFile(html) {
  const p = await ctx.newPage();
  await p.setContent(html, { waitUntil: 'load' });
  const look = await p.evaluate(() => {
    const r = document.querySelector('.vc-report');
    const lk = (el) => { const s = getComputedStyle(el); return [s.fontSize, s.fontWeight, s.color, s.backgroundColor].join(' '); };
    return {
      title: lk(r.querySelector('.vc-report__title')),
      tag: lk(r.querySelector('.vc-tag--feature')),
      cell: lk(r.querySelector('.vc-report__brand .vc-cell')),
      table: lk(r.querySelector('.vc-table th')),
    };
  });
  return { p, look };
}
const opened = await openFile(file);
if (asked.length) failures.push(`the file asked for ${asked.length} thing(s), such as ${asked[0]}`);
for (const [part, value] of Object.entries(made.look)) {
  if (opened.look[part] !== value) failures.push(`the file's ${part} looks different: ${opened.look[part]} instead of ${value}`);
}
// A file has no script: only a browser that answers @supports at-rule() keeps its fixed footer out.
const asks = await opened.p.evaluate(() => CSS.supports('at-rule(@bottom-left)'));
const filePrint = footerOf(await opened.p.pdf({ preferCSSPageSize: true, printBackground: true }), { fixed: asks ? fixed : '' });
failures.push(...filePrint.problems.map((p) => `the file, printed: ${p}`));
const control = await openFile(`<!DOCTYPE html><html lang="en-GB"><body>${made.bareMarkup}</body></html>`);
if (Object.entries(made.look).every(([part, value]) => control.look[part] === value)) failures.push('self-test: the bare markup without the file\'s styles passed the look test');

await browser.close();
server.close();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Printed the example on ${plain.pages} pages with the footer and "page i of n" on each, once more with the notice on each and once without @supports at-rule(), never with the fixed footer beside it, and the file of its own (${kb} KB) on ${filePrint.pages} pages: it asked for nothing and kept the look of the title, the AI tag, the brand cell and the table. Light sheets in the dark theme; the print copy stays hidden on screen and leaves no trace.`);
console.log('REPORT PRINT OK');
