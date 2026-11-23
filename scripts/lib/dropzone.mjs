// The drop zone's rule as a pure function, so a prototype's own tests can import it without running the
// docs checks: import { dropzoneProblems } from '<ViciDesign>/scripts/lib/dropzone.mjs'.
// scripts/check-dropzone.mjs proves it with a self-test and runs it on the Forms page.
//
// A drop zone (components/forms.html#drop-zone) is a real file input, visually hidden but focusable,
// with the zone as its label, so a click, the keyboard and a screen reader all reach the file dialog. It
// names the kinds of file it takes in `accept`, says in a notice what may be uploaded, and lists the files
// in a list that announces changes. Every file has a name and a remove button that says which file it
// removes; a refused file, or one with a warning, says why in words.

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

/** Every element with the given class inside a piece of markup: its tag, attributes and inner HTML. */
function elementsWithClass(html, name) {
  const out = [];
  for (const m of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    if (!hasClass(m[2], name)) continue;
    const tag = m[1].toLowerCase();
    const start = m.index + m[0].length;
    out.push({ tag, attrs: m[2], inner: VOID.has(tag) ? '' : html.slice(start, closeOf(html, tag, start).end) });
  }
  return out;
}

/** Every start tag of an element, with its attributes. */
const tagsOf = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'gi'))].map((m) => m[1]);

/** The accessible name of a button: its aria-label, or its text. */
function buttonName(attrs, inner) {
  return (attr(attrs, 'aria-label') || '').trim() || (attr(attrs, 'aria-labelledby') ? 'labelled' : '') || textOf(inner);
}

/**
 * Problems with the drop zones in a screen's markup; an empty list means every zone has a focusable file
 * input that names what it accepts, a label for it, a notice and a list that announces changes, and
 * every file in it has a name, a remove button that names the file and, when refused or warned about,
 * a reason in words.
 */
export function dropzoneProblems(html) {
  const source = String(html).replace(/<!--[\s\S]*?-->/g, ' ');
  const problems = [];
  const zones = elementsWithClass(source, 'vc-dropzone');
  const allFiles = elementsWithClass(source, 'vc-dropzone__file').length;
  const inZones = zones.reduce((n, z) => n + elementsWithClass(z.inner, 'vc-dropzone__file').length, 0);
  if (allFiles > inZones) problems.push(`${allFiles - inZones} file row(s) (.vc-dropzone__file) sit outside a .vc-dropzone`);

  zones.forEach((zone, z) => {
    const label = `drop zone ${z + 1}`;
    if (!hasAttr(zone.attrs, 'data-vc-dropzone')) problems.push(`${label} has no data-vc-dropzone, so dropped files never reach the page`);
    const inputs = tagsOf(zone.inner, 'input').filter((a) => (attr(a, 'type') || '').toLowerCase() === 'file');
    if (inputs.length !== 1) { problems.push(`${label} has ${inputs.length} file inputs; it has one`); return; }
    const input = inputs[0];
    if (!hasClass(input, 'vc-dropzone__input')) problems.push(`${label}'s file input has no class vc-dropzone__input`);
    if (!(attr(input, 'accept') || '').trim()) problems.push(`${label}'s file input names no kinds of file in accept`);
    if (hasAttr(input, 'tabindex') && attr(input, 'tabindex') === '-1') problems.push(`${label}'s file input is out of the tab order (tabindex="-1")`);
    if (hasAttr(input, 'hidden') || /display\s*:\s*none/i.test(attr(input, 'style') || '')) problems.push(`${label}'s file input is hidden from everyone; hide it visually only`);
    const id = attr(input, 'id');
    const target = elementsWithClass(zone.inner, 'vc-dropzone__target')[0];
    if (!target) problems.push(`${label} has no .vc-dropzone__target to drop on`);
    else {
      if (target.tag !== 'label') problems.push(`${label}'s target is a <${target.tag}>; it is the <label> of the file input`);
      else if (!id || attr(target.attrs, 'for') !== id) problems.push(`${label}'s target is not the label of its file input (for="${id || ''}")`);
      if (!textOf(target.inner)) problems.push(`${label}'s target says nothing: tell people to drop files or choose them`);
    }
    const notice = elementsWithClass(zone.inner, 'vc-dropzone__notice')[0];
    if (!notice || !textOf(notice.inner)) problems.push(`${label} has no notice (.vc-dropzone__notice) on what may be uploaded`);
    const list = elementsWithClass(zone.inner, 'vc-dropzone__files')[0];
    if (!list) problems.push(`${label} has no file list (.vc-dropzone__files)`);
    else {
      if (!/^(ul|ol)$/.test(list.tag)) problems.push(`${label}'s files sit in a <${list.tag}>; they are a list (<ul>)`);
      if (attr(list.attrs, 'aria-live') !== 'polite') problems.push(`${label}'s file list doesn't announce changes (aria-live="polite")`);
    }
    elementsWithClass(zone.inner, 'vc-dropzone__file').forEach((file, f) => {
      const nameEl = elementsWithClass(file.inner, 'vc-dropzone__name')[0];
      const name = nameEl ? textOf(nameEl.inner) : '';
      const where = name ? `${label}, file "${name.slice(0, 40)}"` : `${label}, file ${f + 1}`;
      if (!name) problems.push(`${where} has no name (.vc-dropzone__name)`);
      const buttons = [...file.inner.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
      if (!buttons.length) problems.push(`${where} has no remove button`);
      for (const [, attrs, inner] of buttons) {
        if (attr(attrs, 'type') !== 'button') problems.push(`${where}'s button has no type="button"`);
        const bn = buttonName(attrs, inner);
        if (!bn) problems.push(`${where}'s button has no name`);
        else if (name && bn !== 'labelled' && !bn.includes(name)) problems.push(`${where}'s button "${bn}" doesn't say which file it removes`);
      }
      const state = attr(file.attrs, 'data-state');
      if (state !== undefined && !['refused', 'warning'].includes(state)) problems.push(`${where} has data-state="${state}"; it is refused or warning, or absent`);
      if (state) {
        const why = elementsWithClass(file.inner, 'vc-dropzone__error')[0];
        if (!why || !textOf(why.inner)) problems.push(`${where} is ${state} but doesn't say why (.vc-dropzone__error)`);
      }
    });
  });
  return problems;
}
