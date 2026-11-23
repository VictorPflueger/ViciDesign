#!/usr/bin/env node
// A strict security policy: the blank starter, where prototypes start, carries a content security policy
// that lets in only the site's own scripts and styles, and has no inline script, style or event handler,
// so it runs unchanged under the policy. Prototypes import policyProblems() from scripts/lib/policy.mjs.
// A self-test first proves that the checker catches planted mistakes and passes a page that keeps the rule.
// The app, dashboard and landing starters still inline their theme line and a few styles, and are not
// held to it.
import { read } from './lib/files.mjs';
import { policyProblems } from './lib/policy.mjs';

export { policyProblems };

const strict = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'none'">`;
const page = (head, body) => `<!doctype html><html lang="en-GB"><head>${head}</head><body>${body}</body></html>`;
const good = page(`${strict}<link rel="stylesheet" href="dist/vici.css"><script src="dist/vici-theme.js"></script><script type="application/json" id="data">{"a":1}</script>`,
  '<!-- <p style="color:red" onclick="x()"></p> --><main class="vc-stack"><h1>Fine</h1><a href="https://example.org/">A link</a></main>');
const planted = {
  'no policy at all': page('', '<main></main>'),
  'a second policy': page(strict + strict, '<main></main>'),
  "'unsafe-inline' for scripts": page(`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'">`, '<main></main>'),
  'styles from anywhere': page(`<meta http-equiv="Content-Security-Policy" content="script-src 'self'; style-src *">`, '<main></main>'),
  'an inline theme line': page(`${strict}<script>try{document.documentElement.dataset.theme='dark'}catch(e){}</script>`, '<main></main>'),
  'a style attribute': page(strict, '<main><h1 style="margin:0">Title</h1></main>'),
  'a style element': page(`${strict}<style>h1{margin:0}</style>`, '<main></main>'),
  'an onclick handler': page(strict, '<main><button type="button" onclick="go()">Go</button></main>'),
  'a javascript: link': page(strict, '<main><a href="javascript:go()">Go</a></main>'),
};
const selfFailures = [];
if (policyProblems(good).length) selfFailures.push(`a page that keeps the rule was rejected: ${policyProblems(good).join('; ')}`);
for (const [name, html] of Object.entries(planted)) if (!policyProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
if (process.argv.includes('--self-test')) {
  console.log(`Self-test caught ${n}/${n} planted mistakes and passed a page that keeps the rule.`);
  console.log('POLICY SELF-TEST OK');
  process.exit(0);
}

const problems = policyProblems(read('starters/blank.html'));
if (problems.length) {
  console.error(problems.map((p) => `✗ starters/blank.html: ${p}`).join('\n'));
  process.exit(1);
}
console.log(`Self-test caught ${n}/${n} planted mistakes.`);
console.log('starters/blank.html: a strict policy, and no inline script, style or event handler.');
console.log('POLICY OK');
