#!/usr/bin/env node
// The live-run dialog's rule: its parts in order (the key, the setting, the cap, the acknowledgement, the
// estimate, the start button), a key field that forms and password managers leave alone with a show
// button, a note, a link and "Forget key", one setting chosen, a cap in view, an acknowledgement left
// unticked, an estimate that is announced, and a disabled start button with the AI notice beside it.
// Prototypes import liveDialogProblems() from scripts/lib/live.mjs and run it on each screen. This check
// proves the function on planted mistakes and two clean dialogs, then holds the Overlays page to the rule.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, read } from './lib/files.mjs';
import { liveDialogProblems } from './lib/live.mjs';

export { liveDialogProblems };

const T = {
  en: { title: 'Run it live', key: 'Your API key', note: 'It stays in this tab’s memory.', link: 'Get a key', forget: 'Forget key', show: 'Show key', setting: 'Setting', options: ['Fast', 'Balanced', 'Thorough'], research: 'Look up recent news first', advanced: 'Advanced', cap: 'Budget cap for this run', ack: 'I will enter public information only: nothing confidential, personal or otherwise protected.', est: 'About €0.01 and one to two minutes.', notice: 'You are interacting with an AI system', start: 'Start the live run' },
  de: { title: 'Live ausführen', key: 'Ihr API-Schlüssel', note: 'Er bleibt im Speicher dieses Tabs.', link: 'Schlüssel holen', forget: 'Schlüssel vergessen', show: 'Schlüssel zeigen', setting: 'Einstellung', options: ['Schnell', 'Ausgewogen', 'Gründlich'], research: 'Zuerst aktuelle Nachrichten suchen', advanced: 'Erweitert', cap: 'Budgetgrenze für diesen Lauf', ack: 'Ich gebe nur öffentliche Informationen ein: nichts Vertrauliches, Persönliches oder anders Geschütztes.', est: 'Etwa 0,01 € und ein bis zwei Minuten.', notice: 'Sie interagieren mit einem KI-System', start: 'Live-Lauf starten' }
};

const dialog = (lang = 'en', o = {}) => {
  const t = T[lang];
  const id = `k-${lang}`;
  const p = {
    tag: 'dialog',
    attrs: ` aria-labelledby="t-${lang}"`,
    field: `<input class="vc-input" id="${id}" type="password" autocomplete="off" spellcheck="false" data-1p-ignore data-lpignore="true" aria-describedby="n-${lang}">`,
    show: `<button type="button" class="vc-icon-button" aria-controls="${id}" aria-pressed="false" aria-label="${t.show}"><span class="vc-icon vc-icon--eye" aria-hidden="true"></span></button>`,
    label: `<label class="vc-label" for="${id}">${t.key}</label>`,
    link: `<a href="https://platform.claude.com/settings/keys" target="_blank" rel="noopener">${t.link}</a>`,
    forget: `<button type="button" class="vc-button vc-button--ghost vc-button--sm vc-live__forget">${t.forget}</button>`,
    setting: `<fieldset class="vc-live__part vc-live__setting"><legend class="vc-label">${t.setting}</legend><div class="vc-segmented" role="radiogroup">${t.options.map((x, i) => `<label><input type="radio" name="s-${lang}" value="${i}"${i === 1 ? ' checked' : ''}><span>${x}</span></label>`).join('')}</div></fieldset>`,
    optional: `<div class="vc-live__part vc-live__research"><label class="vc-switch"><input type="checkbox" role="switch"> ${t.research}</label></div><details class="vc-live__part vc-live__advanced"><summary>${t.advanced}</summary><div></div></details>`,
    cap: `<div class="vc-live__part vc-live__cap"><label class="vc-label" for="c-${lang}">${t.cap}</label><div class="vc-slider-field"><input class="vc-slider" id="c-${lang}" type="range" min="0.05" max="3" step="0.05" value="0.5"><output for="c-${lang}">€0.50</output></div></div>`,
    ack: `<label class="vc-checkbox vc-live__ack"><input type="checkbox"> ${t.ack}</label>`,
    warning: '',
    est: `<p class="vc-live__estimate" aria-live="polite">${t.est}</p>`,
    notice: `<span class="vc-tag vc-tag--feature"><span class="vc-icon vc-icon--sparkle" aria-hidden="true"></span>${t.notice}</span>`,
    start: `<button type="button" class="vc-button vc-live__start" disabled>${t.start}</button>`,
    ...o
  };
  const key = `<section class="vc-live__part vc-live__key">${p.label}<div class="vc-live__key-row">${p.field}${p.show}</div><p class="vc-help" id="n-${lang}">${t.note} ${p.link}</p><p class="vc-live__current" hidden><span class="vc-live__masked">sk-ant-…9fQx</span> ${p.forget}</p></section>`;
  const body = p.body || [key, p.setting, p.optional, p.cap, p.ack, p.warning, p.est].join('');
  const footer = p.footer || `<footer class="vc-dialog__footer vc-live__footer">${p.notice}${p.start}</footer>`;
  return `<${p.tag} class="vc-dialog vc-live"${p.attrs}><header class="vc-dialog__header"><h2 class="vc-dialog__title" id="t-${lang}">${t.title}</h2></header><div class="vc-dialog__body vc-live__body">${body}</div>${footer}</${p.tag}>`;
};

const clean = dialog('en')
  + dialog('de', { warning: '<div class="vc-alert vc-alert--warning vc-live__warning" role="alert"><p>Gefunden:</p><ul><li>eine E-Mail-Adresse</li></ul></div>' })
  + '<!-- <div class="vc-live__start"></div> -->';

const T0 = T.en;
const planted = {
  'a dialog that is a div': dialog('en', { tag: 'div' }),
  'a dialog without a name': dialog('en', { attrs: '' }),
  'a dialog inside a form': `<form>${dialog('en')}</form>`,
  'a dialog holding a form': dialog('en', { setting: `<form><fieldset class="vc-live__part vc-live__setting"><legend>x</legend><div><label><input type="radio" name="s" checked>A</label></div></fieldset></form>` }),
  'a key field of type text': dialog('en', { field: '<input class="vc-input" id="k-en" type="text" autocomplete="off" spellcheck="false" data-1p-ignore data-lpignore="true" aria-describedby="n-en">' }),
  'a key field without autocomplete="off"': dialog('en', { field: '<input class="vc-input" id="k-en" type="password" spellcheck="false" data-1p-ignore data-lpignore="true" aria-describedby="n-en">' }),
  'a key field the spellchecker reads': dialog('en', { field: '<input class="vc-input" id="k-en" type="password" autocomplete="off" data-1p-ignore data-lpignore="true" aria-describedby="n-en">' }),
  'a key field 1Password fills': dialog('en', { field: '<input class="vc-input" id="k-en" type="password" autocomplete="off" spellcheck="false" data-lpignore="true" aria-describedby="n-en">' }),
  'a key field LastPass fills': dialog('en', { field: '<input class="vc-input" id="k-en" type="password" autocomplete="off" spellcheck="false" data-1p-ignore aria-describedby="n-en">' }),
  'a key field without its note': dialog('en', { field: '<input class="vc-input" id="k-en" type="password" autocomplete="off" spellcheck="false" data-1p-ignore data-lpignore="true">' }),
  'a key field without a label': dialog('en', { label: `<span class="vc-label">${T0.key}</span>` }),
  'a key field without a show button': dialog('en', { show: '' }),
  'a show button without aria-pressed': dialog('en', { show: `<button type="button" class="vc-icon-button" aria-controls="k-en" aria-label="${T0.show}"></button>` }),
  'a key part without a link': dialog('en', { link: '' }),
  'a key link without noopener': dialog('en', { link: `<a href="https://platform.claude.com/settings/keys" target="_blank">${T0.link}</a>` }),
  'a key part without "Forget key"': dialog('en', { forget: '' }),
  'a setting without a choice': dialog('en', { setting: `<fieldset class="vc-live__part vc-live__setting"><legend>${T0.setting}</legend></fieldset>` }),
  'a setting with nothing chosen': dialog('en', { setting: `<fieldset class="vc-live__part vc-live__setting"><legend>${T0.setting}</legend>${T0.options.map((x) => `<label><input type="radio" name="s">${x}</label>`).join('')}</fieldset>` }),
  'a setting with two chosen': dialog('en', { setting: `<fieldset class="vc-live__part vc-live__setting"><legend>${T0.setting}</legend>${T0.options.map((x, i) => `<label><input type="radio" name="s"${i ? ' checked' : ''}>${x}</label>`).join('')}</fieldset>` }),
  'a cap without a range': dialog('en', { cap: `<div class="vc-live__part vc-live__cap"><label class="vc-label">${T0.cap}</label><output>€0.50</output></div>` }),
  'a cap value outside its range': dialog('en', { cap: `<div class="vc-live__part vc-live__cap"><label class="vc-label" for="c-en">${T0.cap}</label><input class="vc-slider" id="c-en" type="range" min="0.05" max="3" value="5"><output for="c-en">€5.00</output></div>` }),
  'a cap without its value in view': dialog('en', { cap: `<div class="vc-live__part vc-live__cap"><label class="vc-label" for="c-en">${T0.cap}</label><input class="vc-slider" id="c-en" type="range" min="0.05" max="3" value="0.5"></div>` }),
  'an acknowledgement ticked in the markup': dialog('en', { ack: `<label class="vc-checkbox vc-live__ack"><input type="checkbox" checked> ${T0.ack}</label>` }),
  'an acknowledgement that says nothing': dialog('en', { ack: '<label class="vc-checkbox vc-live__ack"><input type="checkbox"> OK</label>' }),
  'an estimate nobody hears': dialog('en', { est: `<p class="vc-live__estimate">${T0.est}</p>` }),
  'a start button that is enabled': dialog('en', { start: `<button type="button" class="vc-button vc-live__start">${T0.start}</button>` }),
  'a start button of the ghost kind': dialog('en', { start: `<button type="button" class="vc-button vc-button--ghost vc-live__start" disabled>${T0.start}</button>` }),
  'a start link': dialog('en', { start: `<a class="vc-button vc-live__start" href="#">${T0.start}</a>` }),
  'a start button without the AI notice': dialog('en', { notice: '' }),
  'an AI notice in other words': dialog('en', { notice: '<span class="vc-tag vc-tag--feature">AI inside</span>' }),
  'a start button in the body, not the footer': dialog('en', { footer: `<footer class="vc-dialog__footer">${'<span class="vc-tag vc-tag--feature">You are interacting with an AI system</span>'}</footer>`, est: `<p class="vc-live__estimate" aria-live="polite">${T0.est}</p><button type="button" class="vc-button vc-live__start" disabled>${T0.start}</button>` }),
  'the cap before the setting': dialog('en', { body: null, setting: `<div class="vc-live__part vc-live__cap"><label class="vc-label" for="c-en">${T0.cap}</label><input class="vc-slider" id="c-en" type="range" min="0.05" max="3" value="0.5"><output for="c-en">€0.50</output></div>`, cap: `<fieldset class="vc-live__part vc-live__setting"><legend>${T0.setting}</legend><label><input type="radio" name="s" checked>A</label></fieldset>` }),
  'research after the cap': dialog('en', { optional: '', ack: `<div class="vc-live__part vc-live__research"><label class="vc-switch"><input type="checkbox" role="switch"> ${T0.research}</label></div><label class="vc-checkbox vc-live__ack"><input type="checkbox"> ${T0.ack}</label>` }),
  'a warning that lists nothing': dialog('en', { warning: '<div class="vc-alert vc-alert--warning vc-live__warning" role="alert"><p>Something looks private.</p></div>' }),
  'a part outside any dialog': `<label class="vc-checkbox vc-live__ack"><input type="checkbox"> ${T0.ack}</label>`,
};

const selfFailures = [];
const c = liveDialogProblems(clean);
if (c.length) selfFailures.push(`a clean dialog was rejected: ${c.join('; ')}`);
for (const [name, html] of Object.entries(planted)) if (!liveDialogProblems(html).length) selfFailures.push(`missed: ${name}`);
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
console.log(`Self-test caught ${n}/${n} planted mistakes and passed two clean live-run dialogs, in English and German, one with a private-data warning.`);

// The Overlays page, as the build writes it.
const page = 'components/overlays.html';
if (!existsSync(join(ROOT, page))) {
  console.error(`${page} is missing: run node scripts/build.mjs first`);
  process.exit(1);
}
const html = read(page);
const dialogs = (html.match(/<dialog class="vc-dialog vc-live"/g) || []).length;
const problems = liveDialogProblems(html);
const missing = [];
if (!dialogs) missing.push('live-run dialog');
for (const part of ['vc-live__research', 'vc-live__advanced', 'vc-live__warning', 'vc-live__current']) if (!html.includes(part)) missing.push(part);
if (problems.length || missing.length) {
  console.error([...problems, ...(missing.length ? [`its demo shows no ${missing.join(', ')}`] : [])].map((p) => `${page}: ${p}`).join('\n'));
  process.exit(1);
}
console.log(`${page}: ${dialogs} live-run dialog(s) with every part in order, the key field left alone by forms and password managers, and the AI notice beside the disabled start button.`);
console.log('LIVE DIALOG OK');
