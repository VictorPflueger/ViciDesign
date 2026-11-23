#!/usr/bin/env node
// The horizon strip's rule: a name, two to six lanes that name their span in words, an empty lane that
// says so, every marker an image named in words with its number and placed once, sizes in a key and the
// numbers in a table. Prototypes import horizonProblems() from scripts/lib/horizon.mjs and run it on each
// screen. This check proves the function on planted mistakes and a clean sample, then holds the Data
// display page to the rule.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, read } from './lib/files.mjs';
import { horizonProblems } from './lib/horizon.mjs';

export { horizonProblems };

const marker = (n, { size = '', words = `Issue ${n}: Emission allowances`, role = ' role="img"', residual = false } = {}) =>
  `<li><span class="vc-risk__marker${size ? ` vc-risk__marker--${size}` : ''}${residual ? ' vc-risk__marker--residual' : ''}"${role}${words === null ? '' : ` aria-label="${words}"`}>${n}</span></li>`;
const lane = (label, markers = '', empty = 'None') =>
  `<li class="vc-horizon__lane">${label === null ? '' : `<p class="vc-horizon__label">${label}</p>`}${markers ? `<ul class="vc-horizon__markers">${markers}</ul>` : empty === null ? '' : `<p class="vc-horizon__empty">${empty}</p>`}</li>`;
const key = (sizes = ['sm', 'lg']) => `<ul class="vc-risk__key">${sizes.map((s) => `<li data-size="${s}">${s === 'sm' ? 'Small: under €1m a year' : 'Large: €3m a year or more'}</li>`).join('')}</ul>`;
const table = '<details class="vc-risk__numbers"><summary>Show the numbers</summary><table><tr><th>Issue</th><th>When</th></tr></table></details>';
const strip = ({ caption = '<figcaption><p>When the issues arrive</p></figcaption>', lanes, list = 'ol', extra = key() + table, attrs = '' } = {}) =>
  `<figure class="vc-horizon"${attrs}>${caption}<${list} class="vc-horizon__lanes">${(lanes ?? [
    lane('Now <span class="vc-horizon__span">within a year</span>', marker(2, { size: 'lg' }) + marker(5)),
    lane('1 to 3 years', marker(1, { size: 'sm' }) + marker(1, { residual: true, words: 'Issue 1 after the answer' })),
    lane('Later <span class="vc-horizon__span">after 3 years</span>'),
  ]).join('')}</${list}>${extra}</figure>`;

const clean = strip()
  + strip({ caption: '', attrs: ' aria-label="Wann die Risiken eintreten"', lanes: [lane('Jetzt', marker(3, { words: 'Risiko 3: Netzentgelte' })), lane('Später', '', 'Keins')], extra: table })
  + '<!-- <figure class="vc-horizon"></figure> -->';

const planted = {
  'a strip without a name': strip({ caption: '' }),
  'lanes in an unordered list': strip({ list: 'ul' }),
  'a strip with one lane': strip({ lanes: [lane('Now', marker(1))] }),
  'a strip with seven lanes': strip({ lanes: Array.from({ length: 7 }, (_, i) => lane(`Year ${i + 1}`, marker(i + 1))) }),
  'a lane without a name': strip({ lanes: [lane(null, marker(1)), lane('Later')] }),
  'an empty lane that does not say so': strip({ lanes: [lane('Now', marker(1)), lane('Later', '', null)] }),
  'a marker without a number': strip({ lanes: [lane('Now', marker('')), lane('Later')] }),
  'a marker that is not an image': strip({ lanes: [lane('Now', marker(1, { role: '' })), lane('Later')] }),
  'a marker without words': strip({ lanes: [lane('Now', marker(1, { words: null })), lane('Later')] }),
  'a marker whose words leave out its number': strip({ lanes: [lane('Now', marker(12, { words: 'Issue 1: Port fees' })), lane('Later')] }),
  'one issue in two lanes': strip({ lanes: [lane('Now', marker(4)), lane('Later', marker(4))] }),
  'sized markers without a key': strip({ extra: table }),
  'a large marker the key leaves unnamed': strip({ extra: key(['sm']) + table }),
  'a strip without its table': strip({ extra: key() }),
};

const selfFailures = [];
const c = horizonProblems(clean);
if (c.length) selfFailures.push(`a clean strip was rejected: ${c.join('; ')}`);
for (const [name, html] of Object.entries(planted)) if (!horizonProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
console.log(`Self-test caught ${n}/${n} planted mistakes and passed two clean strips in two languages.`);

// The Data display page, as the build writes it.
const page = 'components/data.html';
if (!existsSync(join(ROOT, page))) {
  console.error(`${page} is missing: run node scripts/build.mjs first`);
  process.exit(1);
}
const html = read(page);
const strips = (html.match(/<figure class="vc-horizon"/g) || []).length;
const problems = horizonProblems(html);
const missing = [];
if (!strips) missing.push('horizon strip');
if (!/class="vc-horizon__empty"/.test(html)) missing.push('empty lane');
if (problems.length || missing.length) {
  console.error([...problems, ...(missing.length ? [`its demo shows no ${missing.join(', ')}`] : [])].map((p) => `${page}: ${p}`).join('\n'));
  process.exit(1);
}
console.log(`${page}: ${strips} horizon strip(s), every lane named, every marker named once, and the table.`);
console.log('HORIZON OK');
