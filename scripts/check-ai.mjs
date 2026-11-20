#!/usr/bin/env node
// The AI-notice rule: a page that can start a live run with a model (its content security policy
// connects to a model's API, or an element carries data-vc-live) says "You are interacting with an AI
// system" in its markup. Vici's own pages and starters run no model, so the rule binds the prototypes
// built on Vici; they import aiNoticeProblems() from scripts/lib/ai.mjs. A self-test first proves that
// the checker catches planted mistakes and passes a page that keeps the rule.
import { read, sitePages } from './lib/files.mjs';
import { aiNoticeProblems, AI_NOTICE } from './lib/ai.mjs';

export { aiNoticeProblems };

const page = (head, body) => `<!doctype html><html lang="en-GB"><head>${head}</head><body>${body}</body></html>`;
const live = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src https://api.anthropic.com">`;
const notice = `<span class="vc-tag vc-tag--feature"><span class="vc-icon vc-icon--sparkle" aria-hidden="true"></span>${AI_NOTICE.en}</span>`;

// ------------------------------------------------------------------ self-test
const good = page(live, `<header>${notice}</header><main><button type="button">Start agent</button></main>`);
const planted = {
  'live page without the notice': page(live, '<main><button type="button">Start agent</button></main>'),
  'notice only in a comment': page(live, `<!-- ${AI_NOTICE.en} --><main></main>`),
  'notice only in a script': page(live, `<script>const n = "${AI_NOTICE.en}";</script><main></main>`),
  'live control without the notice': page('', '<main><button type="button" data-vc-live>Live run</button></main>'),
};
const quiet = page(`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'none'">`, '<main><p>A replay, no model.</p></main>');
const selfFailures = [];
if (aiNoticeProblems(good).length) selfFailures.push(`a page with the notice was rejected: ${aiNoticeProblems(good).join('; ')}`);
if (aiNoticeProblems(quiet).length) selfFailures.push('a page that runs no model was asked for the notice');
if (aiNoticeProblems(page(live, `<p lang="de">${AI_NOTICE.de}</p>`)).length) selfFailures.push('the German notice was rejected');
for (const [name, html] of Object.entries(planted)) if (!aiNoticeProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
if (process.argv.includes('--self-test')) {
  console.log(`Self-test caught ${n}/${n} planted mistakes and passed a page with the notice and a page without a model.`);
  console.log('AI NOTICE SELF-TEST OK');
  process.exit(0);
}

// ------------------------------------------------------------------ real files
const failures = [];
const pages = sitePages();
for (const p of pages) {
  const problems = aiNoticeProblems(read(p));
  if (problems.length) failures.push(`${p}: ${problems.join('; ')}`);
}
if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  console.error(`\n${failures.length} AI-notice problem(s)`);
  process.exit(1);
}
console.log(`Self-test caught ${n}/${n} planted mistakes.`);
console.log(`${pages.length} pages and starters: none runs a model without saying so.`);
console.log('AI NOTICE OK');
