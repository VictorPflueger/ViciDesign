#!/usr/bin/env node
// The ring's rule: the centre first and six named cells clockwise after it, every state shown with a
// mark and a word, never with colour alone, and a name for the ring. Prototypes import ringProblems()
// from scripts/lib/ring.mjs and run it on each screen. This check proves the function on planted
// mistakes and a clean sample, then holds the Framework view page to the rule.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, read } from './lib/files.mjs';
import { ringProblems } from './lib/ring.mjs';

export { ringProblems };

const NAMES = ['Political', 'Economic', 'Social', 'Technological', 'Environmental', 'Legal'];
const word = (icon, text) => `<span class="vc-ring__state">${icon ? `<span class="vc-icon vc-icon--${icon}" aria-hidden="true"></span>` : ''}${text}</span>`;
const cell = ({ name = 'Political', status, state = '', tag = 'button', type = ' type="button"', extra = '' } = {}) =>
  `<li><${tag} class="vc-ring__cell"${tag === 'button' ? type : ''}${status ? ` data-status="${status}"` : ''}${extra}><span class="vc-ring__name">${name}</span><span class="vc-ring__note">2 factors</span>${state}</${tag}></li>`;
const centre = (name = 'Auental Energie') => `<li><p class="vc-ring__centre"><span class="vc-ring__name">${name}</span></p></li>`;
const ring = ({ cells, first = centre(), caption = '<figcaption><p>The six dimensions around the company</p></figcaption>', list = 'ol', attrs = '' } = {}) =>
  `<figure class="vc-ring"${attrs}><${list} class="vc-ring__cells">${first}${(cells ?? NAMES.map((name) => cell({ name }))).join('')}</${list}>${caption}</figure>`;

const mixed = NAMES.map((name, i) => cell({
  name,
  status: [undefined, 'pressure', 'watch', 'addressed', 'pressure', undefined][i],
  state: [, word('warning', 'Under pressure'), word('eye', 'Beobachten'), word('check', 'Addressed'), word('warning', 'Unter Druck')][i] ?? '',
  extra: i === 1 ? ' aria-pressed="true"' : i ? ' aria-pressed="false"' : '',
}));
const clean = ring({ cells: mixed })
  + ring({ cells: NAMES.map((name) => cell({ name, tag: 'div' })), caption: '', attrs: ' aria-label="Die sechs Dimensionen"' })
  + '<!-- <figure class="vc-ring"><ol class="vc-ring__cells"></ol></figure> -->';

const six = (i, over) => NAMES.map((name, n) => (n === i ? cell({ name, ...over }) : cell({ name })));
const planted = {
  'a ring without a name': ring({ caption: '' }),
  'a ring with an empty caption': ring({ caption: '<figcaption> </figcaption>' }),
  'a ring with five cells around its centre': ring({ cells: NAMES.slice(0, 5).map((name) => cell({ name })) }),
  'a ring with seven cells around its centre': ring({ cells: [...NAMES, 'Ethical'].map((name) => cell({ name })) }),
  'a ring whose centre comes last': ring({ first: '', cells: [...NAMES.map((name) => cell({ name })), centre()] }),
  'a ring whose centre has no name': ring({ first: centre('') }),
  'a cell without a name': ring({ cells: six(2, { name: '' }) }),
  'a button cell without type="button"': ring({ cells: six(0, { type: '' }) }),
  'a cell under pressure without a word': ring({ cells: six(1, { status: 'pressure' }) }),
  'a cell under pressure whose word has no mark': ring({ cells: six(1, { status: 'pressure', state: word('', 'Under pressure') }) }),
  'a cell on watch with an empty word': ring({ cells: six(3, { status: 'watch', state: word('eye', ' ') }) }),
  'an unknown cell status': ring({ cells: six(4, { status: 'burning', state: word('warning', 'Burning') }) }),
  'cells in a div rather than a list': ring({ list: 'div' }),
  'a cell list outside a ring': `<ol class="vc-ring__cells">${centre()}${NAMES.map((name) => cell({ name })).join('')}</ol>`,
};

const selfFailures = [];
const c = ringProblems(clean);
if (c.length) selfFailures.push(`a clean ring was rejected: ${c.join('; ')}`);
for (const [name, html] of Object.entries(planted)) if (!ringProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
console.log(`Self-test caught ${n}/${n} planted mistakes and passed two clean rings, every state included, in two languages.`);

// The Framework view page, as the build writes it.
const page = 'components/framework.html';
if (!existsSync(join(ROOT, page))) {
  console.error(`${page} is missing: run node scripts/build.mjs first`);
  process.exit(1);
}
const html = read(page);
const rings = (html.match(/<figure class="vc-ring"/g) || []).length;
const problems = ringProblems(html);
// The page's demo shows every state, and a chosen cell, so the docs show what the rule covers.
const missing = [];
if (!rings) missing.push('ring');
for (const v of ['pressure', 'watch', 'addressed']) if (!new RegExp(`class="vc-ring__cell"[^>]*\\bdata-status="${v}"`).test(html)) missing.push(`cell with data-status="${v}"`);
if (!/class="vc-ring__cell"[^>]*\baria-pressed="true"/.test(html)) missing.push('chosen cell (aria-pressed="true")');
if (problems.length || missing.length) {
  console.error([...problems, ...(missing.length ? [`its demo shows no ${missing.join(', ')}`] : [])].map((p) => `${page}: ${p}`).join('\n'));
  process.exit(1);
}
console.log(`${page}: ${rings} ring(s), centre first, six named cells, every state with a mark and a word.`);
console.log('RING OK');
