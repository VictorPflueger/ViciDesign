#!/usr/bin/env node
// The risk matrix's rules: 25 cells, each in the band impact × likelihood gives and showing its score,
// every marker in its own cell, a key naming the four bands in words and a table of the numbers.
// Prototypes import riskMatrixProblems() and band() from scripts/lib/risk.mjs. This check proves the
// function on planted mistakes and a clean matrix, then holds the Data display page to the rule.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, read } from './lib/files.mjs';
import { riskMatrixProblems, band } from './lib/risk.mjs';

export { riskMatrixProblems, band };

/** A clean matrix with markers at the given [impact, likelihood, label] places. */
function matrix({ markers = [[4, 4, '1'], [3, 2, '2']], skip, bandOf = band, score = (s) => s, key = ['low', 'medium', 'high', 'critical'], table = true, caption = true, loose = '' } = {}) {
  const rows = [];
  for (let i = 5; i >= 1; i--) {
    rows.push(`<span class="vc-risk__tick">${i}</span>`);
    for (let l = 1; l <= 5; l++) {
      if (skip && skip[0] === i && skip[1] === l) continue;
      const m = markers.filter(([mi, ml]) => mi === i && ml === l).map(([mi, ml, t]) => `<span class="vc-risk__marker" data-impact="${mi}" data-likelihood="${ml}">${t}</span>`).join('');
      rows.push(`<div class="vc-risk__cell" data-impact="${i}" data-likelihood="${l}" data-band="${bandOf(i * l)}"><span class="vc-risk__score">${score(i * l)}</span>${m}</div>`);
    }
  }
  return `<figure class="vc-risk">${caption ? '<figcaption><p class="vc-chart__title">Issues</p></figcaption>' : ''}<div class="vc-risk__plot"><div class="vc-risk__grid">${rows.join('')}${loose}</div></div>`
    + `<ul class="vc-risk__key">${key.map((b) => `<li data-band="${b}">${b}</li>`).join('')}</ul>${table ? '<details class="vc-risk__numbers"><summary>Numbers</summary><table><tr><td>1</td></tr></table></details>' : ''}</figure>`;
}

const selfFailures = [];
const bands = [[1, 'low'], [4, 'low'], [5, 'medium'], [9, 'medium'], [10, 'high'], [15, 'high'], [16, 'critical'], [25, 'critical']];
for (const [s, b] of bands) if (band(s) !== b) selfFailures.push(`band(${s}) is ${band(s)}, not ${b}`);
const clean = riskMatrixProblems(matrix());
if (clean.length) selfFailures.push(`a clean matrix was rejected: ${clean.join('; ')}`);
const planted = {
  'a missing cell': matrix({ skip: [3, 3] }),
  'a cell in the wrong band': matrix({ bandOf: (s) => (s === 12 ? 'medium' : band(s)) }),
  'a cell without its score': matrix({ score: (s) => (s === 6 ? '' : s) }),
  'a marker in the wrong cell': matrix({ markers: [[4, 4, '1']] }).replace('data-impact="4" data-likelihood="4">1', 'data-impact="2" data-likelihood="4">1'),
  'a marker outside the cells': matrix({ loose: '<span class="vc-risk__marker">9</span>' }),
  'a key without critical': matrix({ key: ['low', 'medium', 'high'] }),
  'no table of the numbers': matrix({ table: false }),
  'no caption or label': matrix({ caption: false }),
};
for (const [name, html] of Object.entries(planted)) if (!riskMatrixProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
console.log(`Self-test: eight band boundaries right, ${n}/${n} planted mistakes caught, a clean matrix passed.`);

const page = 'components/data.html';
if (!existsSync(join(ROOT, page))) {
  console.error(`${page} is missing: run node scripts/build.mjs first`);
  process.exit(1);
}
const html = read(page);
const count = (html.match(/<figure class="vc-risk"/g) || []).length;
const problems = riskMatrixProblems(html);
if (problems.length || !count) {
  console.error([...problems, ...(count ? [] : ['no risk matrix demo'])].map((p) => `${page}: ${p}`).join('\n'));
  process.exit(1);
}
console.log(`${page}: ${count} risk matrix, 25 cells in their bands, every marker in its cell, the key and the table.`);
console.log('RISK MATRIX OK');
