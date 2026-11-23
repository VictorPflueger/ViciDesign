#!/usr/bin/env node
// The drop zone's rule: a real file input in the tab order that names what it accepts, the zone as its
// label, a notice on what may be uploaded, a list that announces changes, and every file with a name, a
// remove button that names it and, when refused or warned about, a reason in words. Prototypes import
// dropzoneProblems() from scripts/lib/dropzone.mjs and run it on each screen. This check proves the
// function on planted mistakes and a clean sample, then holds the Forms page to the rule.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, read } from './lib/files.mjs';
import { dropzoneProblems } from './lib/dropzone.mjs';

export { dropzoneProblems };

const file = ({ name = 'report.pdf', state = '', why = '', button = `<button type="button" class="vc-icon-button vc-icon-button--sm" aria-label="Remove ${name}"><span class="vc-icon vc-icon--close" aria-hidden="true"></span></button>`, nameClass = 'vc-dropzone__name' } = {}) =>
  `<li class="vc-dropzone__file"${state ? ` data-state="${state}"` : ''}><span class="vc-icon vc-icon--memo" aria-hidden="true"></span><span class="vc-dropzone__body"><span class="${nameClass}">${name}</span><span class="vc-dropzone__meta">PDF · 104 KB</span>${why}</span>${button}</li>`;
const why = (text) => `<span class="vc-dropzone__error"><span class="vc-icon vc-icon--error" aria-hidden="true"></span>${text}</span>`;
const zone = ({
  attrs = ' data-vc-dropzone',
  input = '<input class="vc-dropzone__input" id="z1" type="file" multiple accept=".pdf,.md,.txt,.csv,.json">',
  target = '<label class="vc-dropzone__target" for="z1"><span class="vc-dropzone__title">Drop files here or <span class="vc-dropzone__browse">choose files</span></span></label>',
  notice = '<p class="vc-dropzone__notice">Public information only.</p>',
  list = 'ul', live = ' aria-live="polite"',
  files = [file()]
} = {}) => `<div class="vc-dropzone"${attrs}>${input}${target}${notice}<${list} class="vc-dropzone__files"${live}>${files.join('')}</${list}></div>`;

const clean = zone({ files: [file(), file({ name: 'plan.docx', state: 'refused', why: why('Save it as PDF first.') }), file({ name: 'swot.json', state: 'warning', why: why('A stand-in.') })] })
  + zone({ files: [], notice: '<p class="vc-dropzone__notice">Nur öffentliche Informationen.</p>', input: '<input class="vc-dropzone__input" id="z2" type="file" accept=".pdf">', target: '<label class="vc-dropzone__target" for="z2">Dateien hier ablegen</label>' })
  + '<!-- <li class="vc-dropzone__file"></li> -->';

const planted = {
  'a zone without data-vc-dropzone': zone({ attrs: '' }),
  'a zone without a file input': zone({ input: '' }),
  'a zone with two file inputs': zone({ input: '<input class="vc-dropzone__input" id="z1" type="file" accept=".pdf"><input type="file" accept=".pdf">' }),
  'a file input without accept': zone({ input: '<input class="vc-dropzone__input" id="z1" type="file">' }),
  'a file input out of the tab order': zone({ input: '<input class="vc-dropzone__input" id="z1" type="file" accept=".pdf" tabindex="-1">' }),
  'a file input hidden from everyone': zone({ input: '<input class="vc-dropzone__input" id="z1" type="file" accept=".pdf" hidden>' }),
  'a target that is a div, not the label': zone({ target: '<div class="vc-dropzone__target">Drop files here</div>' }),
  'a label for another input': zone({ target: '<label class="vc-dropzone__target" for="other">Drop files here</label>' }),
  'a target that says nothing': zone({ target: '<label class="vc-dropzone__target" for="z1"><span class="vc-icon vc-icon--upload"></span></label>' }),
  'a zone without its notice': zone({ notice: '' }),
  'a file list that announces nothing': zone({ live: '' }),
  'files in a div, not a list': zone({ list: 'div' }),
  'a file without a name': zone({ files: [file({ nameClass: 'other' })] }),
  'a file without a remove button': zone({ files: [file({ button: '' })] }),
  'a remove button without type="button"': zone({ files: [file({ button: '<button class="vc-icon-button" aria-label="Remove report.pdf"></button>' })] }),
  'a remove button without a name': zone({ files: [file({ button: '<button type="button" class="vc-icon-button"><span class="vc-icon vc-icon--close" aria-hidden="true"></span></button>' })] }),
  "a remove button that doesn't name its file": zone({ files: [file({ button: '<button type="button" class="vc-icon-button" aria-label="Remove"></button>' })] }),
  "a refused file that doesn't say why": zone({ files: [file({ state: 'refused' })] }),
  'an unknown file state': zone({ files: [file({ state: 'broken', why: why('Broken.') })] }),
  'a file row outside any zone': `<ul class="vc-dropzone__files" aria-live="polite">${file()}</ul>`,
};

const selfFailures = [];
const c = dropzoneProblems(clean);
if (c.length) selfFailures.push(`a clean drop zone was rejected: ${c.join('; ')}`);
for (const [name, html] of Object.entries(planted)) if (!dropzoneProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
console.log(`Self-test caught ${n}/${n} planted mistakes and passed two clean drop zones, a refused and a warned file included, in two languages.`);

// The Forms page, as the build writes it.
const page = 'components/forms.html';
if (!existsSync(join(ROOT, page))) {
  console.error(`${page} is missing: run node scripts/build.mjs first`);
  process.exit(1);
}
const html = read(page);
const zones = (html.match(/<div class="vc-dropzone"/g) || []).length;
const problems = dropzoneProblems(html);
// The page's demo shows every state, so the docs show what the rule covers.
const missing = [];
if (!zones) missing.push('drop zone');
for (const v of ['refused', 'warning']) if (!new RegExp(`class="vc-dropzone__file"[^>]*\\bdata-state="${v}"`).test(html)) missing.push(`file with data-state="${v}"`);
if (problems.length || missing.length) {
  console.error([...problems, ...(missing.length ? [`its demo shows no ${missing.join(', ')}`] : [])].map((p) => `${page}: ${p}`).join('\n'));
  process.exit(1);
}
console.log(`${page}: ${zones} drop zone(s), a focusable input with its label, the notice, and every file with a name, a remove button and its reason.`);
console.log('DROPZONE OK');
