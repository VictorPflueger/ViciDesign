#!/usr/bin/env node
// The How it works rule: the app, dashboard and blank starters open with a guide that follows the
// standard on Components > How it works guide. One dialog.vc-guide that opens by itself; a title
// "How the prototype|demo|challenge|showcase works" (or its German form); chapters "what" first,
// "how" second and "present" last, three to eight in all; in each chapter one heading of at most
// 60 characters, one lead of at most 40 words and at most one figure, table or list of at most five
// items; a presenting path of three to seven steps, each with a sentence to say in quotation marks
// and a time in minutes; a header button with visible text; Back, Next and the count; no eyebrow;
// and every key figure the page marks with data-vc-kpi explained in a row of the How it works
// chapter's table: the figure, what it measures and its value. A page in two languages may carry one
// such guide per language, each saying its language in lang, titled in it, with its own header button
// and a row for every key figure under its name in that language (data-vc-kpi-de and so on). A key
// figure that covers part of the data on purpose (data-vc-part) says in a vc-stat__also line what lies
// outside it, so it never contradicts the screen; and a session cost that is an estimate says it is what a
// live run would cost and that the replay costs nothing.
// A self-test first proves that the checker catches planted mistakes.
import { read } from './lib/files.mjs';
import { guideProblems } from './lib/guide.mjs';

// Prototypes import the rule from scripts/lib/guide.mjs; this export stays for older imports.
export { guideProblems };

const STARTERS = ['starters/app.html', 'starters/dashboard.html', 'starters/blank.html'];

// ------------------------------------------------------------------ self-test
const good = read('starters/app.html');
// The app starter in two languages: a German guide beside the English one, each with its button, and the
// key figures named in German in the German guide's How it works rows.
const KPI_DE = { 'Open exceptions': 'Offene Ausnahmen', 'Auto-resolved': 'Automatisch geklärt', 'Value at risk': 'Wert im Risiko' };
let dialogDe = good.match(/<dialog\b[^>]*vc-guide[\s\S]*?<\/dialog>/)[0]
  .replace('id="guide"', 'id="guide-de" lang="de"')
  .replace('aria-labelledby="guide-title"', 'aria-labelledby="guide-de-title"')
  .replace('id="guide-title">How the prototype works<', 'id="guide-de-title">So funktioniert der Prototyp<');
let twoLanguages = good
  .replace('<dialog class="vc-dialog vc-guide" id="guide"', '<dialog class="vc-dialog vc-guide" id="guide" lang="en"')
  .replace(/(<button\b[^>]*data-vc-guide-open="guide"[^>]*>[\s\S]*?<\/button>)/, '$1<button type="button" class="vc-button vc-button--secondary" data-vc-guide-open="guide-de" lang="de" hidden><span class="vc-icon vc-icon--info" aria-hidden="true"></span>So funktioniert\'s</button>');
for (const [en, de] of Object.entries(KPI_DE)) {
  dialogDe = dialogDe.replace(`<th scope="row">${en}</th>`, `<th scope="row">${de}</th>`);
  twoLanguages = twoLanguages.replace(`data-vc-kpi="${en}"`, `data-vc-kpi="${en}" data-vc-kpi-de="${de}"`);
}
twoLanguages = twoLanguages.replace('</body>', `${dialogDe}\n</body>`);
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
  'two guides, one without lang': twoLanguages.replace('id="guide-de" lang="de"', 'id="guide-de"'),
  'two guides in one language': twoLanguages.replace('id="guide-de" lang="de"', 'id="guide-de" lang="en-GB"'),
  'a German guide with an English title': twoLanguages.replace('id="guide-de-title">So funktioniert der Prototyp<', 'id="guide-de-title">How the prototype works<'),
  'a key figure the German guide has no row for': twoLanguages.replace('data-vc-kpi-de="Wert im Risiko"', 'data-vc-kpi-de="Gefährdeter Wert"'),
  'a second guide without its own button': twoLanguages.replace(/<button\b[^>]*data-vc-guide-open="guide-de"[^>]*>[\s\S]*?<\/button>/, ''),
  'a key figure for part of the data that says nothing of the rest': good.replace('data-vc-kpi="Open exceptions"', 'data-vc-kpi="Open exceptions" data-vc-part="exceptions over €1,000"'),
  'a session cost that reads as money spent': good.replace('<main', '<article class="vc-stat" data-vc-kpi="Session cost"><p class="vc-stat__label">Session cost</p><p class="vc-stat__value">€0.38</p><p class="vc-stat__note">Estimated, simulated run</p></article><main')
    .replace('<tr><th scope="row">Open exceptions</th>', '<tr><th scope="row">Session cost</th><td>What a live run would cost</td><td class="vc-num">€0.38</td></tr><tr><th scope="row">Open exceptions</th>'),
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
// A key figure for part of the data passes once a vc-stat__also line says what lies outside it.
const partPage = planted['a key figure for part of the data that says nothing of the rest'];
const withAlso = partPage.replace(/(data-vc-part="exceptions over €1,000"[^>]*>[\s\S]*?)(<\/article>)/, '$1<p class="vc-stat__also">3 more under €1,000</p>$2');
const alsoProblems = guideProblems(withAlso);
if (withAlso === partPage) selfFailures.push('the also-line control changed nothing');
else if (alsoProblems.length) selfFailures.push(`a key figure for part of the data with its also line was rejected: ${alsoProblems.join('; ')}`);
// A session cost that says what a live run would cost and that the replay is free passes.
const costPage = planted['a session cost that reads as money spent'];
const costSaid = costPage.replace('<p class="vc-stat__value">€0.38</p><p class="vc-stat__note">Estimated, simulated run</p>', '<p class="vc-stat__value">≈ €0.38<span class="vc-stat__unit">for a live run</span></p><p class="vc-stat__note">this replay: €0</p>');
const costProblems = guideProblems(costSaid);
if (costSaid === costPage) selfFailures.push('the session-cost control changed nothing');
else if (costProblems.length) selfFailures.push(`a session cost that says what a live run would cost and that the replay is free was rejected: ${costProblems.join('; ')}`);
// And a page with one complete guide per language passes.
const twoProblems = guideProblems(twoLanguages);
if (twoLanguages.split('class="vc-dialog vc-guide"').length !== 3) selfFailures.push('the two-language page has no second guide');
else if (twoProblems.length) selfFailures.push(`a page with one guide per language was rejected: ${twoProblems.join('; ')}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
if (process.argv.includes('--self-test')) {
  console.log(`Self-test caught ${n}/${n} planted mistakes and accepted a complete guide, also one per language.`);
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
