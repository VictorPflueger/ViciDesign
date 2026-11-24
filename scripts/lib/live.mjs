// The live-run dialog's rule as a pure function, so a prototype's own tests can import it without running
// the docs checks: import { liveDialogProblems } from '<ViciDesign>/scripts/lib/live.mjs'.
// scripts/check-live.mjs proves it with a self-test and runs it on the Overlays page.
//
// A live-run dialog (components/overlays.html#live-run) is where a person hands a prototype their own API
// key and starts a live run. Its parts come in a fixed order: the key, the setting, the budget cap, the
// acknowledgement, the estimate and the start button, with research and Advanced between the setting and
// the cap where a prototype has them. The key field is a password field in no form, with autocomplete
// off and the password managers' ignore marks, a show button, a note on where the key stays and a link
// to where keys come from; a held key shows masked with "Forget key". The acknowledgement is unticked in
// the markup, the start button disabled until the page enables it, and the AI notice stands beside it in
// the fixed words.

import { AI_NOTICE } from './ai.mjs';

/** The text a person reads inside a piece of markup. */
function textOf(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, 'x')
    .replace(/\s+/g, ' ')
    .trim();
}

const hasClass = (attrs, name) => new RegExp(`\\bclass\\s*=\\s*["'][^"']*(?<![\\w-])${name}(?![\\w-])`).test(attrs);
const attr = (attrs, name) => (attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']*)["']`)) || [])[1];
const hasAttr = (attrs, name) => new RegExp(`(?:^|\\s)${name}(?=[\\s=/>]|$)`).test(attrs);

/** The end of the element whose start tag ends at `start`, counting nested elements of the same tag. */
function closeOf(html, tag, start) {
  const re = new RegExp(`<${tag}\\b[^>]*>|</${tag}\\s*>`, 'gi');
  re.lastIndex = start;
  let depth = 1;
  for (let n = re.exec(html); n; n = re.exec(html)) {
    depth += n[0][1] === '/' ? -1 : 1;
    if (!depth) return { end: n.index, after: n.index + n[0].length };
  }
  return { end: html.length, after: html.length };
}

const VOID = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'source', 'col', 'area', 'base', 'wbr']);

/** Every element with the given class inside a piece of markup: its tag, attributes, inner HTML and place. */
function elementsWithClass(html, name) {
  const out = [];
  for (const m of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    if (!hasClass(m[2], name)) continue;
    const tag = m[1].toLowerCase();
    const start = m.index + m[0].length;
    out.push({ tag, attrs: m[2], at: m.index, inner: VOID.has(tag) ? '' : html.slice(start, closeOf(html, tag, start).end) });
  }
  return out;
}

/** Every start tag of an element, with its attributes and place. */
const tagsOf = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'gi'))].map((m) => ({ attrs: m[1], at: m.index }));

/** The accessible name of a button: its aria-label, or its text. */
function buttonName(attrs, inner) {
  return (attr(attrs, 'aria-label') || '').trim() || (attr(attrs, 'aria-labelledby') ? 'labelled' : '') || textOf(inner);
}

/** True when the markup before `at` leaves a <form> open. */
function insideForm(html, at) {
  const before = html.slice(0, at);
  return (before.match(/<form\b/gi) || []).length > (before.match(/<\/form\s*>/gi) || []).length;
}

/** The parts of the dialog, in the order they must come. */
const ORDER = ['vc-live__key', 'vc-live__setting', 'vc-live__cap', 'vc-live__ack', 'vc-live__estimate', 'vc-live__start'];
const OPTIONAL = ['vc-live__research', 'vc-live__advanced'];

/**
 * Problems with the live-run dialogs in a screen's markup; an empty list means each dialog has its parts
 * in order: a key field that password managers and forms leave alone, with a show button, a note, a link
 * and "Forget key"; a setting with one option chosen; a cap with its range and value in view; an
 * acknowledgement left unticked; an estimate that is announced; and a disabled start button with the AI
 * notice beside it.
 */
export function liveDialogProblems(html) {
  const source = String(html).replace(/<!--[\s\S]*?-->/g, ' ');
  const problems = [];
  const dialogs = elementsWithClass(source, 'vc-live');
  const parts = [...ORDER, ...OPTIONAL, 'vc-live__forget', 'vc-live__warning'];
  for (const part of parts) {
    const all = elementsWithClass(source, part).length;
    const inside = dialogs.reduce((n, d) => n + elementsWithClass(d.inner, part).length, 0);
    if (all > inside) problems.push(`${all - inside} element(s) with class ${part} sit outside a .vc-live dialog`);
  }

  dialogs.forEach((dialog, d) => {
    const label = `live-run dialog ${d + 1}`;
    const inner = dialog.inner;
    if (dialog.tag !== 'dialog') problems.push(`${label} is a <${dialog.tag}>, not a <dialog>`);
    if (!attr(dialog.attrs, 'aria-labelledby') && !attr(dialog.attrs, 'aria-label')) problems.push(`${label} has no accessible name (aria-labelledby or aria-label)`);
    if (insideForm(source, dialog.at) || /<form\b/i.test(inner)) problems.push(`${label} sits in a <form> or holds one, so a browser may offer to save the key`);

    // Every required part once, in order.
    const places = {};
    for (const part of ORDER) {
      const found = elementsWithClass(inner, part);
      if (found.length !== 1) { problems.push(`${label} has ${found.length} ${part}; it has one`); continue; }
      places[part] = found[0];
    }
    const seen = ORDER.filter((p) => places[p]);
    for (let i = 1; i < seen.length; i++) {
      if (places[seen[i]].at < places[seen[i - 1]].at) problems.push(`${label} puts ${seen[i]} before ${seen[i - 1]}; the order is key, setting, cap, acknowledgement, estimate, start`);
    }
    for (const part of OPTIONAL) {
      for (const el of elementsWithClass(inner, part)) {
        if (places['vc-live__setting'] && el.at < places['vc-live__setting'].at) problems.push(`${label} puts ${part} before the setting`);
        if (places['vc-live__cap'] && el.at > places['vc-live__cap'].at) problems.push(`${label} puts ${part} after the cap`);
      }
    }

    // The key.
    const key = places['vc-live__key'];
    if (key) {
      const fields = tagsOf(key.inner, 'input').filter((t) => (attr(t.attrs, 'type') || '').toLowerCase() === 'password');
      if (fields.length !== 1) problems.push(`${label}'s key part has ${fields.length} password fields; it has one`);
      else {
        const f = fields[0].attrs;
        const id = attr(f, 'id');
        if ((attr(f, 'autocomplete') || '').toLowerCase() !== 'off') problems.push(`${label}'s key field lacks autocomplete="off"`);
        if ((attr(f, 'spellcheck') || '').toLowerCase() !== 'false') problems.push(`${label}'s key field lacks spellcheck="false", so a spellchecker may send the key away`);
        if (!hasAttr(f, 'data-1p-ignore')) problems.push(`${label}'s key field lacks data-1p-ignore`);
        if (attr(f, 'data-lpignore') !== 'true') problems.push(`${label}'s key field lacks data-lpignore="true"`);
        if (!id) problems.push(`${label}'s key field has no id`);
        else {
          if (!new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*["']${id}["']`).test(inner)) problems.push(`${label}'s key field has no <label for="${id}">`);
          const reveal = tagsOf(key.inner, 'button').find((b) => attr(b.attrs, 'aria-controls') === id || attr(b.attrs, 'data-vc-reveal') === id || hasAttr(b.attrs, 'data-reveal'));
          const anyShow = reveal || tagsOf(key.inner, 'button').find((b) => hasAttr(b.attrs, 'aria-pressed'));
          if (!anyShow) problems.push(`${label}'s key field has no show button (a button with aria-pressed)`);
          else if (!hasAttr(anyShow.attrs, 'aria-pressed')) problems.push(`${label}'s show button has no aria-pressed`);
          else if (!(attr(anyShow.attrs, 'aria-label') || '').trim()) problems.push(`${label}'s show button has no aria-label`);
        }
        const note = attr(f, 'aria-describedby');
        if (!note || !note.split(/\s+/).some((n) => new RegExp(`\\bid\\s*=\\s*["']${n}["']`).test(inner))) problems.push(`${label}'s key field points to no note (aria-describedby) on where the key stays`);
      }
      const links = tagsOf(key.inner, 'a').filter((a) => /^https:\/\//.test(attr(a.attrs, 'href') || ''));
      if (!links.length) problems.push(`${label}'s key part has no link to where keys come from`);
      else if (!links.every((a) => /\bnoopener\b/.test(attr(a.attrs, 'rel') || ''))) problems.push(`${label}'s key link lacks rel="noopener"`);
      const forget = elementsWithClass(key.inner, 'vc-live__forget');
      if (forget.length !== 1) problems.push(`${label}'s key part has no "Forget key" button (.vc-live__forget)`);
      else if (forget[0].tag !== 'button' || attr(forget[0].attrs, 'type') !== 'button') problems.push(`${label}'s "Forget key" is not a <button type="button">`);
      else if (!buttonName(forget[0].attrs, forget[0].inner)) problems.push(`${label}'s "Forget key" button says nothing`);
    }

    // The setting: one option chosen.
    const setting = places['vc-live__setting'];
    if (setting) {
      const radios = tagsOf(setting.inner, 'input').filter((t) => (attr(t.attrs, 'type') || '').toLowerCase() === 'radio');
      const selects = tagsOf(setting.inner, 'select');
      if (!radios.length && !selects.length) problems.push(`${label}'s setting offers no choice (radios or a select)`);
      if (radios.length) {
        const names = new Set(radios.map((r) => attr(r.attrs, 'name')));
        if (names.size !== 1 || names.has(undefined)) problems.push(`${label}'s setting radios don't share one name`);
        const checked = radios.filter((r) => hasAttr(r.attrs, 'checked')).length;
        if (checked !== 1) problems.push(`${label}'s setting has ${checked} options chosen; it has one, the default`);
      }
      if (!/<legend\b/i.test(setting.inner) && !attr(setting.attrs, 'aria-labelledby') && !attr(setting.attrs, 'aria-label')) problems.push(`${label}'s setting has no name (a legend or aria-label)`);
    }

    // The cap: a range in view.
    const cap = places['vc-live__cap'];
    if (cap) {
      const inputs = tagsOf(cap.inner, 'input').filter((t) => /^(range|number)$/i.test(attr(t.attrs, 'type') || ''));
      if (inputs.length !== 1) problems.push(`${label}'s cap has ${inputs.length} range or number inputs; it has one`);
      else {
        const a = inputs[0].attrs;
        const [min, max, value] = ['min', 'max', 'value'].map((n) => Number(attr(a, n)));
        if (![min, max, value].every(Number.isFinite)) problems.push(`${label}'s cap lacks min, max or value`);
        else if (!(min < max) || value < min || value > max) problems.push(`${label}'s cap value ${value} is outside ${min} to ${max}`);
        const id = attr(a, 'id');
        if (!id || !new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*["']${id}["']`).test(cap.inner)) problems.push(`${label}'s cap has no <label for> its input`);
      }
      if (!/<output\b/i.test(cap.inner) && !/\baria-live\s*=/.test(cap.inner)) problems.push(`${label}'s cap shows no value (an <output> or a live region)`);
    }

    // The acknowledgement: unticked in the markup.
    const ack = places['vc-live__ack'];
    if (ack) {
      const boxes = [...tagsOf(ack.inner, 'input'), ...(ack.tag === 'input' ? [{ attrs: ack.attrs }] : [])].filter((t) => (attr(t.attrs, 'type') || '').toLowerCase() === 'checkbox');
      if (boxes.length !== 1) problems.push(`${label}'s acknowledgement has ${boxes.length} checkboxes; it has one`);
      else if (hasAttr(boxes[0].attrs, 'checked')) problems.push(`${label}'s acknowledgement is ticked in the markup; it starts unticked at every opening`);
      if (textOf(ack.inner).length < 20) problems.push(`${label}'s acknowledgement says too little: it names what the person promises`);
    }

    // The warning, where a page shows one: what it found, in a list.
    for (const w of elementsWithClass(inner, 'vc-live__warning')) {
      if (!/<(ul|ol)\b/i.test(w.inner)) problems.push(`${label}'s private-data warning lists nothing (a <ul> of what it found)`);
    }

    // The estimate: announced when it changes.
    const est = places['vc-live__estimate'];
    if (est && attr(est.attrs, 'aria-live') !== 'polite' && attr(est.attrs, 'role') !== 'status') problems.push(`${label}'s estimate is not announced (aria-live="polite")`);

    // The start button: disabled in the markup, with the AI notice beside it.
    const start = places['vc-live__start'];
    if (start) {
      if (start.tag !== 'button' || attr(start.attrs, 'type') !== 'button') problems.push(`${label}'s start is not a <button type="button">`);
      if (!hasClass(start.attrs, 'vc-button') || /vc-button--(ghost|outline|secondary|danger)/.test(attr(start.attrs, 'class') || '')) problems.push(`${label}'s start is not the primary button`);
      if (!hasAttr(start.attrs, 'disabled')) problems.push(`${label}'s start is enabled in the markup; it waits for the key and the acknowledgement`);
      if (!textOf(start.inner)) problems.push(`${label}'s start button says nothing`);
      const footer = elementsWithClass(inner, 'vc-dialog__footer').find((f) => f.inner.includes('vc-live__start'));
      const box = footer ? footer.inner : '';
      const notice = elementsWithClass(box, 'vc-tag--feature').map((t) => textOf(t.inner));
      if (!footer) problems.push(`${label}'s start button is not in the dialog's footer, where it stays in view`);
      else if (!notice.some((n) => n.includes(AI_NOTICE.en) || n.includes(AI_NOTICE.de))) problems.push(`${label} has no lilac AI notice ("${AI_NOTICE.en}") beside the start button`);
    }
  });
  return problems;
}
