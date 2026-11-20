#!/usr/bin/env node
// The How it works rule: the app, dashboard and blank starters open with a guide that follows the
// standard on Components > How it works guide. One dialog.vc-guide that opens by itself; a title
// "How the prototype|demo|challenge|showcase works" (or its German form); chapters "what" first,
// "how" second and "present" last, three to eight in all; in each chapter one heading of at most
// 60 characters, one lead of at most 40 words and at most one figure, table or list of at most five
// items; a presenting path of three to seven steps, each with a sentence to say in quotation marks
// and a time in minutes; a header button with visible text; Back, Next and the count; no eyebrow.
// A self-test first proves that the checker catches planted mistakes.
import { read } from './lib/files.mjs';

const STARTERS = ['starters/app.html', 'starters/dashboard.html', 'starters/blank.html'];
const TITLE = /^(How the (prototype|demo|challenge|showcase) works|So funktioniert (der Prototyp|die Demo|die Challenge|der Showcase))$/;
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

/** Problems with the guide in one HTML page; an empty list means it follows the standard. */
export function guideProblems(html) {
  const out = [];
  const dialogs = [...html.matchAll(/<dialog\b([^>]*\bclass="[^"]*\bvc-guide\b[^"]*"[^>]*)>([\s\S]*?)<\/dialog>/g)];
  if (dialogs.length !== 1) return [dialogs.length ? `${dialogs.length} guides, expected one` : 'no How it works guide'];
  const [, attrs, body] = dialogs[0];
  const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
  if (!/\bdata-vc-guide\b/.test(attrs)) out.push('dialog lacks data-vc-guide');
  if (!/\bdata-vc-guide-auto\b/.test(attrs)) out.push('guide does not open by itself (data-vc-guide-auto)');
  const labelled = (attrs.match(/\baria-labelledby="([^"]+)"/) || [])[1];
  const title = labelled ? (body.match(new RegExp(`<h2\\b[^>]*id="${labelled}"[^>]*>([\\s\\S]*?)</h2>`)) || [])[1] : null;
  if (!title) out.push('no title labelling the dialog');
  else if (!TITLE.test(text(title))) out.push(`title "${text(title)}" breaks the pattern`);
  if (/vc-eyebrow/.test(body)) out.push('eyebrow inside the guide');
  const chapters = [...body.matchAll(/<section\b([^>]*\bclass="[^"]*\bvc-guide__chapter\b[^"]*"[^>]*)>([\s\S]*?)<\/section>/g)]
    .map(([, a, b]) => ({ id: (a.match(/\bdata-vc-chapter="([^"]+)"/) || [])[1], nav: (a.match(/\bdata-vc-nav="([^"]+)"/) || [])[1], body: b }));
  if (chapters.length < 3 || chapters.length > 8) out.push(`${chapters.length} chapters, needs 3 to 8`);
  if (chapters.length) {
    if (chapters[0].id !== 'what') out.push('first chapter is not "what"');
    if (chapters[1] && chapters[1].id !== 'how') out.push('second chapter is not "how"');
    if (chapters.at(-1).id !== 'present') out.push('last chapter is not "present"');
  }
  for (const c of chapters) {
    const where = `chapter "${c.id || '?'}"`;
    if (!c.id) out.push('a chapter without data-vc-chapter');
    if (!c.nav || c.nav.split(/\s+/).length > 5) out.push(`${where}: rail label missing or longer than five words`);
    const heads = [...c.body.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)];
    if (heads.length !== 1) out.push(`${where}: ${heads.length} headings, needs one`);
    else if (text(heads[0][1]).length > 60) out.push(`${where}: heading longer than 60 characters`);
    const leads = [...c.body.matchAll(/<p\b[^>]*class="[^"]*\bvc-guide__lead\b[^"]*"[^>]*>([\s\S]*?)<\/p>/g)];
    if (leads.length !== 1) out.push(`${where}: ${leads.length} leads, needs one`);
    else if (text(leads[0][1]).split(' ').length > 40) out.push(`${where}: lead longer than 40 words`);
    // a table inside a figure counts once
    const tables = (c.body.match(/<table\b/g) || []).length;
    const figures = (c.body.match(/<figure\b/g) || []).length;
    const lists = (c.body.match(/<(ul|ol|dl)\b/g) || []).length;
    const parts = figures + lists + (figures ? 0 : tables);
    if (parts > 1) out.push(`${where}: more than one figure, table or list`);
    for (const l of c.body.matchAll(/<(ul|ol|dl)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
      if (/vc-guide__path/.test(l[2])) continue;
      const items = (l[3].match(/<(li|dt)\b/g) || []).length;
      if (items > 5) out.push(`${where}: a list of ${items} items, at most five`);
    }
  }
  const present = chapters.find((c) => c.id === 'present');
  if (present) {
    const path = (present.body.match(/<ol\b[^>]*class="[^"]*\bvc-guide__path\b[^"]*"[^>]*>([\s\S]*?)<\/ol>/) || [])[1];
    if (!path) out.push('presenting chapter has no ol.vc-guide__path');
    else {
      const steps = [...path.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
      if (steps.length < 3 || steps.length > 7) out.push(`presenting path has ${steps.length} steps, needs 3 to 7`);
      steps.forEach((s, i) => {
        if (!/class="vc-guide__time"[^>]*>\s*\d+([.,]\d+)?\s*min\b/.test(s)) out.push(`presenting step ${i + 1} has no time in minutes`);
        if (!/[“"„][^“”"„]{3,}[”"“]/.test(text(s))) out.push(`presenting step ${i + 1} has no sentence to say in quotation marks`);
      });
    }
  }
  if (!/data-vc-guide-next\b/.test(body) || !/data-vc-guide-back\b/.test(body) || !/class="vc-guide__count"/.test(body)) out.push('footer lacks Back, Next or the count');
  if (id) {
    const opener = html.match(new RegExp(`<button\\b[^>]*data-vc-guide-open="${id}"[^>]*>([\\s\\S]*?)</button>`));
    if (!opener) out.push('no header button that opens the guide');
    else if (!text(opener[1].replace(/<[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/[^>]+>/g, ''))) out.push('the button that opens the guide has no visible text');
  } else out.push('guide has no id');
  return out;
}

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
  'heading too long': good.replace(/<h3>[^<]*<\/h3>/, `<h3>${'A heading that runs far beyond the sixty characters a guide allows'}</h3>`),
};
const selfFailures = [];
const goodProblems = guideProblems(good);
if (goodProblems.length) selfFailures.push(`the app starter's guide was rejected: ${goodProblems.join('; ')}`);
for (const [name, html] of Object.entries(planted)) {
  if (html === good) selfFailures.push(`fixture "${name}" changed nothing`);
  else if (!guideProblems(html).length) selfFailures.push(`missed: ${name}`);
}
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
