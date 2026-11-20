#!/usr/bin/env node
// The How it works rule: the app, dashboard and blank starters open with a guide that follows the
// standard on Components > How it works guide. One dialog.vc-guide that opens by itself; a title
// "How the prototype|demo|challenge|showcase works" (or its German form); chapters "what" first,
// "how" second and "present" last, three to eight in all; in each chapter one heading of at most
// 60 characters, one lead of at most 40 words and at most one figure, table or list of at most five
// items; a presenting path of three to seven steps, each with a sentence to say in quotation marks
// and a time in minutes; a header button with visible text; Back, Next and the count; no eyebrow;
// and every key figure the page marks with data-vc-kpi explained in a row of the How it works
// chapter's table: the figure, what it measures and its value.
// A self-test first proves that the checker catches planted mistakes.
import { read } from './lib/files.mjs';
import { guideProblems } from './lib/guide.mjs';

// Prototypes import the rule from scripts/lib/guide.mjs; this export stays for older imports.
export { guideProblems };

const STARTERS = ['starters/app.html', 'starters/dashboard.html', 'starters/blank.html'];

// ------------------------------------------------------------------ self-test
const good = read('starters/app.html');
const planted = {
  'no guide': good.replace(/<dialog\b[^>]*vc-guide[\s\S]*?<\/dialog>/, ''),
  'title off pattern': good.replace('>How the prototype works</h2>', '>About this prototype</h2>'),
  'presenting chapter not last': good.replace('data-vc-chapter="present"', 'data-vc-chapter="later"'),
  'two leads in a chapter': good.replace('<p class="vc-guide__lead">', '<p class="vc-guide__lead">One more.</p><p class="vc-guide__lead">'),
  'step without a time': good.replace(/<span class="vc-guide__time">1 min<\/span>/, ''),
  'step without a sentence to say': good.replace(/(<ol class="vc-guide__path">\s*<li><strong>[^<]*<\/strong>) “[^”]*”/, '$1'),
  'list of six items': good.replace(/<div class="vc-table-wrap"><table class="vc-table vc-table--compact">\s*<caption>This morning's run<\/caption>[\s\S]*?<\/table><\/div>/, `<ul>${'<li>An item</li>'.repeat(6)}</ul>`),
  'does not open by itself': good.replace(' data-vc-guide-auto', ''),
  'eyebrow inside': good.replace('<h3>', '<p class="vc-eyebrow">Chapter 1 of 3</p><h3>'),
  'key figure the guide never names': good.replace('<main', '<p class="vc-stat" data-vc-kpi="Pallets per hour">48</p><main'),
  'key figure explained outside How it works': good
    .replace('<main', '<p class="vc-stat" data-vc-kpi="Pallets per hour">48</p><main')
    .replace('<p class="vc-guide__lead">Four steps', '<p class="vc-guide__lead">Pallets per hour counts the work. Four steps'),
  'key figure row without its value': good.replace(/(<th scope="row">Open exceptions<\/th><td>[^<]*<\/td>)<td[^>]*>[^<]*<\/td>/, '$1'),
  'heading too long': good.replace(/<h3>[^<]*<\/h3>/, `<h3>${'A heading that runs far beyond the sixty characters a guide allows'}</h3>`),
};
const selfFailures = [];
const goodProblems = guideProblems(good);
if (goodProblems.length) selfFailures.push(`the app starter's guide was rejected: ${goodProblems.join('; ')}`);
for (const [name, html] of Object.entries(planted)) {
  if (html === good) selfFailures.push(`fixture "${name}" changed nothing`);
  else if (!guideProblems(html).length) selfFailures.push(`missed: ${name}`);
}
// The control: the same key figure passes once the How it works chapter gives it a row.
const named = planted['key figure the guide never names'].replace('<tr><th scope="row">Open exceptions</th>', '<tr><th scope="row">Pallets per hour</th><td>Pallets the cell builds in an hour</td><td class="vc-num">48</td></tr><tr><th scope="row">Open exceptions</th>');
const namedProblems = guideProblems(named);
if (named === planted['key figure the guide never names']) selfFailures.push('the control changed nothing');
else if (namedProblems.length) selfFailures.push(`a key figure with its row in How it works was rejected: ${namedProblems.join('; ')}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
if (process.argv.includes('--self-test')) {
  console.log(`Self-test caught ${n}/${n} planted mistakes and accepted a complete guide.`);
  console.log('GUIDE SELF-TEST OK');
  process.exit(0);
}

// ------------------------------------------------------------------ real files
const failures = [];
for (const page of STARTERS) {
  const problems = guideProblems(read(page));
  if (problems.length) failures.push(`${page}: ${problems.join('; ')}`);
}
if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  console.error(`\n${failures.length} guide problem(s)`);
  process.exit(1);
}
console.log(`Self-test caught ${n}/${n} planted mistakes.`);
console.log(`${STARTERS.length} starters open with a How it works guide that follows the standard.`);
console.log('GUIDE OK');
