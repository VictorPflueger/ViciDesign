#!/usr/bin/env node
// The report's rule: a language and the light theme, a cover first whose title is the one top heading, every
// other page one level below it, nothing a printed page can't use, a fixed footer that names Victor Pflüger and
// the byline on the last page. Prototypes import reportProblems() from scripts/lib/report.mjs and run it on the
// report a run ends in. This check proves the function on planted mistakes and two clean reports, then holds
// the Report page's example to the rule.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, read } from './lib/files.mjs';
import { reportProblems } from './lib/report.mjs';
import { profile } from './lib/byline.mjs';

export { reportProblems };

const T = {
  en: { lang: 'en-GB', title: 'Kestrel Valves: the outside forces, challenged', summary: 'Management summary', about: 'About this report', built: 'Built by', site: `${profile.name}'s website` },
  de: { lang: 'de', title: 'Kestrel Valves: die äußeren Kräfte, geprüft', summary: 'Management Summary', about: 'Über diesen Bericht', built: 'Erstellt von', site: `Website von ${profile.name}` }
};

const byline = (t) => `<p class="vc-byline"><span class="vc-byline__label">${t.built}</span> <a class="vc-byline__person" href="${profile.linkedin}" rel="author"><span class="vc-avatar vc-avatar--xs"><img src="portrait-96.jpg" alt="" width="96" height="96"></span><span class="vc-byline__name">${profile.name}</span></a> <a class="vc-byline__icon" href="${profile.website}" rel="author" aria-label="${t.site}"><span class="vc-icon vc-icon--globe-hex" aria-hidden="true"></span></a></p>`;

const report = (lang = 'en', o = {}) => {
  const t = T[lang];
  const top = o.top || 1;
  const p = {
    attrs: ` lang="${t.lang}" data-theme="light"`,
    cover: `<section class="vc-report__page vc-report__cover"><p class="vc-report__brand">PESTEL Challenger</p><div class="vc-report__heading"><h${top} class="vc-report__title">${t.title}</h${top}><p class="vc-report__subtitle">Six dimensions rated.</p></div><dl class="vc-report__meta"><dt>Date</dt><dd>24 November 2026</dd></dl></section>`,
    summary: `<section class="vc-report__page"><h${top + 1}>${t.summary}</h${top + 1}><p>Three of six dimensions are under pressure.</p><figure><svg role="img" aria-label="Risk matrix"><rect width="4" height="4"></rect></svg><figcaption>Five issues</figcaption></figure><details open><summary>Basis</summary><p>The inputs.</p></details></section>`,
    about: `<section class="vc-report__page"><h${top + 1}>${t.about}</h${top + 1}><p>Public information only.</p>${byline(t)}</section>`,
    footer: `<footer class="vc-report__footer"><span>Created with PESTEL Challenger</span><span>${t.built} ${profile.name}</span></footer>`,
    ...o
  };
  return `<article class="vc-report"${p.attrs}>${p.cover}${p.summary}${p.about}${p.footer}</article>`;
};

const clean = report('en')
  + `<section><h2>Your report</h2>${report('de', { top: 3 })}</section>`
  + '<!-- <article class="vc-report"></article> -->';

const T0 = T.en;
const planted = {
  'no report at all': '<main><h1>Summary</h1><p>Three of six dimensions.</p></main>',
  'a report without a language': report('en', { attrs: ' data-theme="light"' }),
  'a report in the dark theme': report('en', { attrs: ` lang="${T0.lang}" data-theme="dark"` }),
  'a report that follows the page theme': report('en', { attrs: ` lang="${T0.lang}"` }),
  'a report of one page': report('en', { summary: '', about: '' }),
  'a report that opens without its cover': report('en', { cover: `<section class="vc-report__page"><h1 class="vc-report__title">${T0.title}</h1></section>` }),
  'a cover without a title': report('en', { cover: '<section class="vc-report__page vc-report__cover"><p class="vc-report__brand">PESTEL Challenger</p></section>' }),
  'a cover that opens with another heading': report('en', { cover: `<section class="vc-report__page vc-report__cover"><h2>PESTEL Challenger</h2><h1 class="vc-report__title">${T0.title}</h1></section>` }),
  'a second top heading': report('en', { summary: `<section class="vc-report__page"><h1>${T0.summary}</h1><p>x</p></section>` }),
  'a page that opens two levels down': report('en', { summary: `<section class="vc-report__page"><h3>${T0.summary}</h3><p>x</p></section>` }),
  'a page that opens without a heading': report('en', { summary: '<section class="vc-report__page"><p>Three of six dimensions are under pressure.</p></section>' }),
  'an embedded report whose pages open at the title\'s level': report('de', { top: 3, summary: `<section class="vc-report__page"><h3>${T.de.summary}</h3></section>` }),
  'a page inside a page': report('en', { summary: `<section class="vc-report__page"><h2>${T0.summary}</h2><div class="vc-report__page"><p>x</p></div></section>` }),
  'a script in the report': report('en', { footer: `<script>print()</script><footer class="vc-report__footer"><span>Built by ${profile.name}</span></footer>` }),
  'a button in the report': report('en', { summary: `<section class="vc-report__page"><h2>${T0.summary}</h2><button type="button">Show more</button></section>` }),
  'a field in the report': report('en', { summary: `<section class="vc-report__page"><h2>${T0.summary}</h2><input type="text" value="x"></section>` }),
  'a closed details in the report': report('en', { summary: `<section class="vc-report__page"><h2>${T0.summary}</h2><details><summary>Basis</summary><p>The inputs.</p></details></section>` }),
  'a report without a fixed footer': report('en', { footer: '' }),
  'a fixed footer without Victor': report('en', { footer: '<footer class="vc-report__footer"><span>Created with PESTEL Challenger</span></footer>' }),
  'a last page without the byline': report('en', { about: `<section class="vc-report__page"><h2>${T0.about}</h2><p>Public information only.</p></section>` }),
  'a byline without rel="author"': report('en', { about: `<section class="vc-report__page"><h2>${T0.about}</h2>${byline(T0).replace(/ rel="author"/g, '')}</section>` }),
  'the byline on the cover only': report('en', { cover: `<section class="vc-report__page vc-report__cover"><h1 class="vc-report__title">${T0.title}</h1>${byline(T0)}</section>`, about: `<section class="vc-report__page"><h2>${T0.about}</h2><p>x</p></section>` }),
  'a picture without alt': report('en', { summary: `<section class="vc-report__page"><h2>${T0.summary}</h2><img src="ring.png"></section>` }),
  'an svg without a name': report('en', { summary: `<section class="vc-report__page"><h2>${T0.summary}</h2><svg><rect width="4" height="4"></rect></svg></section>` }),
};

const selfFailures = [];
const c = reportProblems(clean);
if (c.length) selfFailures.push(`a clean report was rejected: ${c.join('; ')}`);
for (const [name, html] of Object.entries(planted)) if (!reportProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
console.log(`Self-test caught ${n}/${n} planted mistakes and passed two clean reports: one a file of its own in English, one inside a page in German.`);

// The Report page, as the build writes it.
const page = 'components/report.html';
if (!existsSync(join(ROOT, page))) {
  console.error(`${page} is missing: run node scripts/build.mjs first`);
  process.exit(1);
}
const html = read(page);
const preview = (html.match(/<div class="doc-demo__preview">([\s\S]*?)<\/article>/) || [])[1];
const problems = preview ? reportProblems(`${preview}</article>`) : ['its demo shows no report'];
const missing = ['vc-report__brand', 'vc-report__meta', 'data-vc-footer-start', 'data-vc-footer-end', 'data-vc-footer-of', 'data-vc-report-print'].filter((part) => !html.includes(part));
if (problems.length || missing.length) {
  console.error([...problems, ...(missing.length ? [`it shows no ${missing.join(', ')}`] : [])].map((p) => `${page}: ${p}`).join('\n'));
  process.exit(1);
}
console.log(`${page}: its example keeps the rule, with a cover, two pages, the footer's words and a print button.`);
console.log('REPORT OK');
