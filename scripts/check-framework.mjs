#!/usr/bin/env node
// The framework view's state rule: every item shows its state with a mark and a word, never with colour
// alone, and every area has a title. Prototypes import frameworkProblems() from scripts/lib/framework.mjs
// and run it on each screen. This check proves the function on planted mistakes and a clean sample, then
// holds the Framework view page to the rule.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, read } from './lib/files.mjs';
import { frameworkProblems } from './lib/framework.mjs';

export { frameworkProblems };

const item = ({ source = 'entered', status, mark = '<span class="vc-item__mark" aria-hidden="true"></span>', words = '<span class="vc-item__state vc-visually-hidden">Entered</span>', text = 'Drives built to order' } = {}) =>
  `<li><details class="vc-item" data-source="${source}"${status ? ` data-status="${status}"` : ''}><summary class="vc-item__summary">${mark}<span class="vc-item__text">${text}</span><span class="vc-item__states">${words}</span></summary></details></li>`;
const area = (items, title = '<h3 class="vc-framework__title">Strengths</h3>') =>
  `<section class="vc-framework__area">${title}<ul class="vc-framework__items">${items}</ul></section>`;
// An area with a state: the state tags sit in its head under the title.
const stateTag = (kind, word, icon = 'warning') => `<span class="vc-tag vc-tag--sm vc-framework__state vc-framework__state--${kind}">${icon ? `<span class="vc-icon vc-icon--${icon}" aria-hidden="true"></span>` : ''}${word}</span>`;
const block = ({ status, source, states = '', items = item() } = {}) =>
  `<section class="vc-framework__area"${status ? ` data-status="${status}"` : ''}${source ? ` data-source="${source}"` : ''}><header class="vc-framework__head"><h3 class="vc-framework__title">Cost structure</h3>${states ? `<p class="vc-framework__states">${states}</p>` : ''}</header><ul class="vc-framework__items">${items}</ul></section>`;
const tag = (kind, word) => `<span class="vc-tag vc-tag--sm vc-item__state vc-item__state--${kind}">${word}</span>`;

const clean = `<div class="vc-framework">${area([
  item(),
  item({ source: 'ai', mark: '<span class="vc-item__mark"><span class="vc-icon vc-icon--sparkle"></span></span>', words: tag('source', 'AI') }),
  item({ source: 'added', mark: '<span class="vc-item__mark"><span class="vc-icon vc-icon--plus"></span></span>', words: tag('source', 'Hinzugefügt') }),
  item({ status: 'challenged', mark: '<span class="vc-item__mark"><span class="vc-icon vc-icon--warning"></span></span>', words: tag('status', 'Misfiled') }),
  item({ source: 'ai', status: 'addressed', mark: '<span class="vc-item__mark"><span class="vc-icon vc-icon--check"></span></span>', words: tag('source', 'KI') + tag('status', 'Addressed') }),
  item({ source: 'ai', status: 'removed', mark: '<span class="vc-item__mark"><span class="vc-icon vc-icon--minus"></span></span>', words: tag('source', 'AI') + tag('status', 'Removed') }),
].join(''))}${block({ status: 'pressure', states: stateTag('status', '2 issues · high') })}${block({ status: 'watch', states: stateTag('status', '1 Schwachstelle · niedrig', 'eye') })}${block({ status: 'addressed', source: 'ai', states: stateTag('source', 'AI', 'sparkle') + stateTag('status', 'Adapted', 'check') })}<!-- <details class="vc-item" data-source="nonsense"></details> --></div>`;

const planted = {
  'an item without a mark': area(item({ mark: '' })),
  'an item without a state word': area(item({ words: '' })),
  'an entered item whose word is empty': area(item({ words: '<span class="vc-item__state vc-visually-hidden"> </span>' })),
  'an AI item that does not say so': area(item({ source: 'ai', words: tag('status', 'Unsupported') })),
  'an added item that does not say so': area(item({ source: 'added', words: '<span class="vc-item__state">New</span>' })),
  'a challenged item that does not name its fault': area(item({ status: 'challenged', words: tag('source', 'AI') })),
  'an addressed item without its word': area(item({ status: 'addressed' })),
  'an unknown source': area(item({ source: 'imported' })),
  'an unknown status': area(item({ status: 'solved', words: tag('status', 'Solved') })),
  'an item without text': area(item({ text: '' })),
  'an area without a title': area(item(), ''),
  'a removed item without its word': area(item({ status: 'removed', words: tag('source', 'AI') })),
  'an area under pressure without words': block({ status: 'pressure' }),
  'an area under pressure whose word has no mark': block({ status: 'pressure', states: stateTag('status', '2 issues · high', '') }),
  'an area on watch that only says it in an item': block({ status: 'watch', items: item({ words: '<span class="vc-item__state">1 issue · low</span>' }) }),
  'an unknown area status': block({ status: 'burning', states: stateTag('status', 'Burning') }),
  'an area the AI completed that does not say so': block({ source: 'ai' }),
  'an unknown area source': block({ source: 'imported' }),
};

const selfFailures = [];
const c = frameworkProblems(clean);
if (c.length) selfFailures.push(`a clean framework was rejected: ${c.join('; ')}`);
for (const [name, html] of Object.entries(planted)) if (!frameworkProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
console.log(`Self-test caught ${n}/${n} planted mistakes and passed a clean framework, its block states included, in two languages.`);

// The Framework view page, as the build writes it.
const page = 'components/framework.html';
if (!existsSync(join(ROOT, page))) {
  console.error(`${page} is missing: run node scripts/build.mjs first`);
  process.exit(1);
}
const html = read(page);
const items = (html.match(/<details class="vc-item"/g) || []).length;
const problems = frameworkProblems(html);
// The page's demo shows every state at least once, so the docs show what the rule covers.
const missing = [['data-source', 'entered'], ['data-source', 'ai'], ['data-source', 'added'], ['data-status', 'challenged'], ['data-status', 'addressed'], ['data-status', 'removed']]
  .filter(([a, v]) => !new RegExp(`<details class="vc-item"[^>]*\\b${a}="${v}"`).test(html)).map(([a, v]) => `${a}="${v}"`);
for (const v of ['pressure', 'watch', 'addressed']) if (!new RegExp(`<section class="vc-framework__area"[^>]*\\bdata-status="${v}"`).test(html)) missing.push(`an area with data-status="${v}"`);
if (!/<section class="vc-framework__area"[^>]*\bdata-source="ai"/.test(html)) missing.push('an area with data-source="ai"');
if (problems.length || missing.length) {
  console.error([...problems, ...(missing.length ? [`its demo shows no ${missing.join(', ')}`] : [])].map((p) => `${page}: ${p}`).join('\n'));
  process.exit(1);
}
console.log(`${page}: ${items} items, each with a mark and a word for its state.`);
console.log('FRAMEWORK OK');
