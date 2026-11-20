#!/usr/bin/env node
// The byline rule: every documentation page and every starter says that Victor Pflüger built it.
// Each one carries a "Built by" byline that names him and links to his LinkedIn profile and to his
// website, both with rel="author", and the website link has an accessible name. The Streamlit helper
// writes the same two links. Addresses come from src/brand/profile.json. A self-test first proves
// that the checker catches planted mistakes.
import { read, sitePages } from './lib/files.mjs';

const profile = JSON.parse(read('src/brand/profile.json'));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Problems with the bylines in one HTML page; an empty list means at least one complete byline. */
export function bylineProblems(html, p = profile) {
  const blocks = [];
  for (const m of html.matchAll(/<p\b[^>]*class="[^"]*\bvc-byline\b[^"]*"[^>]*>([\s\S]*?)<\/p>/g)) blocks.push(m[1]);
  if (!blocks.length) return ['no byline'];
  const linkTo = (block, href) => [...block.matchAll(new RegExp(`<a\\b[^>]*href="${esc(href)}"[^>]*>`, 'g'))].map((m) => m[0]);
  const reasons = [];
  for (const b of blocks) {
    const why = [];
    if (!/Built by/.test(b)) why.push('no "Built by"');
    if (!b.includes(p.name)) why.push(`does not name ${p.name}`);
    const li = linkTo(b, p.linkedin);
    if (!li.length) why.push('no link to LinkedIn');
    else if (!li.some((a) => /\brel="[^"]*\bauthor\b/.test(a))) why.push('LinkedIn link without rel="author"');
    const web = linkTo(b, p.website);
    if (!web.length) why.push('no link to the website');
    else {
      if (!web.some((a) => /\brel="[^"]*\bauthor\b/.test(a))) why.push('website link without rel="author"');
      if (!web.some((a) => /\baria-label(ledby)?="[^"]+"/.test(a))) why.push('website link without an accessible name');
    }
    if (!why.length) return [];
    reasons.push(why.join(', '));
  }
  return reasons;
}

// ------------------------------------------------------------------ self-test
const good = `<footer><p class="vc-byline"><span class="vc-byline__label">Built by</span><a class="vc-byline__person" href="${profile.linkedin}" rel="author"><span class="vc-byline__name">${profile.name}</span></a><span class="vc-tooltip-anchor"><a class="vc-byline__icon" href="${profile.website}" rel="author" aria-labelledby="t"></a></span></p></footer>`;
const planted = {
  'no byline': '<footer><p>© 2026</p></footer>',
  'no website link': good.replace(/<span class="vc-tooltip-anchor">[\s\S]*?<\/span>/, ''),
  'website link without rel': good.replace(`href="${profile.website}" rel="author"`, `href="${profile.website}"`),
  'LinkedIn link without rel': good.replace(`href="${profile.linkedin}" rel="author"`, `href="${profile.linkedin}"`),
  'wrong name': good.replace(profile.name, 'Someone Else'),
};
const selfFailures = [];
if (bylineProblems(good).length) selfFailures.push(`a complete byline was rejected: ${bylineProblems(good).join('; ')}`);
for (const [name, html] of Object.entries(planted)) if (!bylineProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
if (process.argv.includes('--self-test')) {
  console.log(`Self-test caught ${Object.keys(planted).length}/${Object.keys(planted).length} planted mistakes and accepted a complete byline.`);
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
