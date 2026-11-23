// The framework view's state rule as a pure function, so a prototype's own tests can import it without
// running the docs checks: import { frameworkProblems } from '<ViciDesign>/scripts/lib/framework.mjs'.
// scripts/check-framework.mjs proves it with a self-test and runs it on the Framework view page.
//
// A framework view (components/framework.html) shows the areas of a strategy framework and the items in
// them. Every item carries its state with a mark and a word, never with colour alone: an entered item an
// ink hexagon and a word for screen readers, an item the AI wrote "AI", an item the challenge added
// "Added", a challenged item its fault in words, an addressed item "Addressed". The prototype hands this
// function the HTML a screen shows; every item or area that breaks the rule comes back as a problem.

const SOURCES = new Set(['entered', 'ai', 'added']);
const STATUSES = new Set(['challenged', 'addressed']);

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
const attr = (attrs, name) => (attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`)) || [])[1];

/** The inner HTML of every element with the given class inside a piece of markup (no same-tag nesting). */
function elementsWithClass(html, name) {
  const out = [];
  const re = /<([a-z][a-z0-9-]*)\b([^>]*)>/gi;
  for (const m of html.matchAll(re)) {
    if (!hasClass(m[2], name)) continue;
    const tag = m[1].toLowerCase();
    const start = m.index + m[0].length;
    // Find the matching close tag, counting nested elements of the same tag.
    const open = new RegExp(`<${tag}\\b[^>]*>|</${tag}\\s*>`, 'gi');
    open.lastIndex = start;
    let depth = 1;
    let end = html.length;
    for (let n = open.exec(html); n; n = open.exec(html)) {
      depth += n[0][1] === '/' ? -1 : 1;
      if (!depth) { end = n.index; break; }
    }
    out.push({ attrs: m[2], inner: html.slice(start, end) });
  }
  return out;
}

/**
 * Problems with the item states of a framework view; an empty list means every item carries a mark and a
 * word for its state and every area has a title. `html` is a screen's markup.
 */
export function frameworkProblems(html) {
  const source = String(html).replace(/<!--[\s\S]*?-->/g, ' ');
  const problems = [];
  for (const area of elementsWithClass(source, 'vc-framework__area')) {
    const title = elementsWithClass(area.inner, 'vc-framework__title')[0];
    if (!title || !textOf(title.inner)) problems.push('an area has no title (.vc-framework__title)');
  }
  for (const item of elementsWithClass(source, 'vc-item')) {
    const text = elementsWithClass(item.inner, 'vc-item__text')[0];
    const label = text ? textOf(text.inner).slice(0, 40) : '(no text)';
    const where = `the item "${label}"`;
    if (!text || !textOf(text.inner)) problems.push('an item has no text (.vc-item__text)');
    const src = attr(item.attrs, 'data-source');
    const status = attr(item.attrs, 'data-status');
    if (!SOURCES.has(src)) problems.push(`${where} has data-source="${src ?? ''}"; it is entered, ai or added`);
    if (status !== undefined && !STATUSES.has(status)) problems.push(`${where} has data-status="${status}"; it is challenged or addressed, or absent`);
    if (!/class\s*=\s*["'][^"']*(?<![\w-])vc-item__mark(?![\w-])/.test(item.inner)) problems.push(`${where} has no mark (.vc-item__mark)`);
    const words = elementsWithClass(item.inner, 'vc-item__state').map((s) => ({ attrs: s.attrs, text: textOf(s.inner) }));
    if (!words.some((w) => w.text)) problems.push(`${where} has no word for its state (.vc-item__state)`);
    if ((src === 'ai' || src === 'added') && !words.some((w) => hasClass(w.attrs, 'vc-item__state--source') && w.text)) {
      problems.push(`${where} comes from the ${src === 'ai' ? 'AI' : 'challenge'} but has no source word (.vc-item__state--source)`);
    }
    if (STATUSES.has(status) && !words.some((w) => hasClass(w.attrs, 'vc-item__state--status') && w.text)) {
      problems.push(`${where} is ${status} but has no status word (.vc-item__state--status)${status === 'challenged' ? ' naming its fault' : ''}`);
    }
  }
  return problems;
}
