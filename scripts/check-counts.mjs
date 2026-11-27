#!/usr/bin/env node
// A count opens what it counts (components/data.html#count): every .vc-count and every stat card that is a
// button is a button with type="button" (or a link to a place on the page), holds its number and names what it
// opens, which is on the page. Prototypes import countProblems() from scripts/lib/counts.mjs and run it on each
// screen. This check proves the function on planted mistakes and a clean sample, then holds every page and
// starter to the rule. scripts/check-dialog-render.mjs opens the Data page's count in a browser.
import { read, sitePages } from './lib/files.mjs';
import { countProblems, countsOf } from './lib/counts.mjs';

export { countProblems };

const list = '<dialog class="vc-dialog vc-dialog--drawer" id="duties"><ol><li>One</li></ol></dialog>';
const clean = `<p class="vc-lead">Kept <button type="button" class="vc-count" data-vc-open="duties" aria-haspopup="dialog">5&nbsp;duties</button> in 3 laws.</p>${list}`
  + '<button type="button" class="vc-stat" aria-controls="duties"><span class="vc-stat__label">Reporting duties</span><span class="vc-stat__value">2</span></button>'
  + '<a class="vc-count" href="#duties">48 clusters</a><article class="vc-stat"><p class="vc-stat__value">12</p></article>'
  + '<!-- <span class="vc-count">5 duties</span> --><pre><code>&lt;span class="vc-count"&gt;5&lt;/span&gt;</code></pre>';
const planted = {
  'a count that is a span': `<p>Kept <span class="vc-count" data-vc-open="duties">5 duties</span>.</p>${list}`,
  'a count without type="button"': `<button class="vc-count" data-vc-open="duties">5 duties</button>${list}`,
  'a count without a number': `<button type="button" class="vc-count" data-vc-open="duties">the duties</button>${list}`,
  'a count that names nothing it opens': '<button type="button" class="vc-count">5 duties</button>',
  'a count that opens what isn\'t on the page': `<button type="button" class="vc-count" data-vc-open="clusters">48 clusters</button>${list}`,
  'a stat card button that opens nothing': '<button type="button" class="vc-stat"><span class="vc-stat__value">48</span></button>',
};

const failures = [];
const cleanProblems = countProblems(clean);
if (cleanProblems.length) failures.push(`self-test: the clean sample fails: ${cleanProblems.join('; ')}`);
if (countsOf(clean).length !== 3) failures.push(`self-test: the clean sample holds 3 counts, found ${countsOf(clean).length}`);
for (const [name, html] of Object.entries(planted)) if (!countProblems(html).length) failures.push(`self-test: ${name} was not caught`);

let counts = 0;
for (const page of sitePages()) {
  const html = read(page);
  counts += countsOf(html).length;
  for (const problem of countProblems(html)) failures.push(`${page}: ${problem}`);
}
if (!counts) failures.push('no page shows a count, so the Data page lost its example');

if (failures.length) {
  console.error(failures.map((f) => `✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log(`${Object.keys(planted).length} planted mistakes caught and a clean sample passed; ${counts} count(s) on the pages open what they count.`);
console.log('COUNTS OK');
