#!/usr/bin/env node
// The byline rule: every documentation page and every starter says that Victor Pflüger built it.
// Each one carries a "Built by" byline that names him and links to his LinkedIn profile and to his
// website, both with rel="author", and the website link has an accessible name. The Streamlit helper
// writes the same two links. Addresses come from src/brand/profile.json. A self-test first proves
// that the checker catches planted mistakes.
import { read, sitePages } from './lib/files.mjs';
import { bylineProblems, profile } from './lib/byline.mjs';

// Prototypes import the rule from scripts/lib/byline.mjs; this export stays for older imports.
export { bylineProblems };

// ------------------------------------------------------------------ self-test
const good = `<footer><p class="vc-byline"><span class="vc-byline__label">Built by</span><a class="vc-byline__person" href="${profile.linkedin}" rel="author"><span class="vc-byline__name">${profile.name}</span></a><span class="vc-tooltip-anchor"><a class="vc-byline__icon" href="${profile.website}" rel="author" aria-labelledby="t"></a></span></p></footer>`;
const planted = {
  'no byline': '<footer><p>© 2026</p></footer>',
  'no website link': good.replace(/<span class="vc-tooltip-anchor">[\s\S]*?<\/span>/, ''),
  'website link without rel': good.replace(`href="${profile.website}" rel="author"`, `href="${profile.website}"`),
  'LinkedIn link without rel': good.replace(`href="${profile.linkedin}" rel="author"`, `href="${profile.linkedin}"`),
  'wrong name': good.replace(profile.name, 'Someone Else'),
  'no "Built by"': good.replace('Built by', 'Made by'),
};
const selfFailures = [];
if (bylineProblems(good).length) selfFailures.push(`a complete byline was rejected: ${bylineProblems(good).join('; ')}`);
const german = good.replace('Built by', 'Erstellt von');
if (bylineProblems(german).length) selfFailures.push(`a complete German byline was rejected: ${bylineProblems(german).join('; ')}`);
for (const [name, html] of Object.entries(planted)) if (!bylineProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
if (process.argv.includes('--self-test')) {
  console.log(`Self-test caught ${Object.keys(planted).length}/${Object.keys(planted).length} planted mistakes and accepted a complete byline in English and in German.`);
  console.log('BYLINE SELF-TEST OK');
  process.exit(0);
}

// ------------------------------------------------------------------ real files
const failures = [];
const pages = sitePages();
for (const page of pages) {
  const problems = bylineProblems(read(page));
  if (problems.length) failures.push(`${page}: ${problems.join('; ')}`);
}
const py = read('integrations/streamlit/vici_byline.py');
if (!py.includes(`"${profile.linkedin}"`) || !py.includes(`"${profile.website}"`)) failures.push('integrations/streamlit/vici_byline.py: missing the LinkedIn or website address');
if ((py.match(/rel="author"/g) || []).length < 2) failures.push('integrations/streamlit/vici_byline.py: needs two rel="author" links');

if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  console.error(`\n${failures.length} byline problem(s)`);
  process.exit(1);
}
console.log(`Self-test caught ${Object.keys(planted).length}/${Object.keys(planted).length} planted mistakes.`);
console.log(`${pages.length} pages and starters and the Streamlit helper carry the byline with both links.`);
console.log('BYLINE OK');
