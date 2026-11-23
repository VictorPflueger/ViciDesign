// The ring's rule as a pure function, so a prototype's own tests can import it without running the docs
// checks: import { ringProblems } from '<ViciDesign>/scripts/lib/ring.mjs'.
// scripts/check-ring.mjs proves it with a self-test and runs it on the Framework view page.
//
// A ring (components/framework.html#ring) puts a subject in the centre and the six areas of a framework
// around it, such as a company and the six dimensions of PESTEL. The grid places the cells by their order
// in the markup, so the order is the rule: the centre first, then six cells clockwise from the top, each
// with a name. A cell takes a framework area's states, under pressure, on watch or addressed, and shows
// each with a mark and a word, never with colour alone. A ring has a name a screen reader announces.

export const RING_STATUSES = ['pressure', 'watch', 'addressed'];

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

/** Every element with the given class inside a piece of markup: its tag, attributes and inner HTML. */
function elementsWithClass(html, name) {
  const out = [];
  for (const m of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    if (!hasClass(m[2], name)) continue;
    const tag = m[1].toLowerCase();
    const start = m.index + m[0].length;
    out.push({ tag, attrs: m[2], inner: html.slice(start, closeOf(html, tag, start).end) });
  }
  return out;
}

/** The list items directly inside a list's inner HTML. */
function topItems(html) {
  const out = [];
  const re = /<li\b([^>]*)>/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const start = m.index + m[0].length;
    const { end, after } = closeOf(html, 'li', start);
    out.push({ attrs: m[1], inner: html.slice(start, end) });
    re.lastIndex = after;
  }
  return out;
}

const hasIcon = (html) => /class\s*=\s*["'][^"']*(?<![\w-])vc-icon(?![\w-])/.test(html);
const STATE_WORDS = { pressure: 'under pressure', watch: 'on watch', addressed: 'addressed' };

/**
 * Problems with the rings in a screen's markup; an empty list means every ring has a name, its centre
 * first and six named cells after it, and every cell with a state shows a mark and a word for it.
 */
export function ringProblems(html) {
  const source = String(html).replace(/<!--[\s\S]*?-->/g, ' ');
  const problems = [];
  const rings = elementsWithClass(source, 'vc-ring');
  const lists = elementsWithClass(source, 'vc-ring__cells').length;
  const inRings = rings.reduce((n, r) => n + elementsWithClass(r.inner, 'vc-ring__cells').length, 0);
  if (lists > inRings) problems.push(`${lists - inRings} ring cell list(s) sit outside a .vc-ring`);

  rings.forEach((ring, r) => {
    const label = `ring ${r + 1}`;
    const cellLists = elementsWithClass(ring.inner, 'vc-ring__cells');
    if (cellLists.length !== 1) {
      problems.push(`${label} has ${cellLists.length} cell lists (.vc-ring__cells); it has one`);
      return;
    }
    const list = cellLists[0];
    const caption = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i.exec(ring.inner);
    const named = (caption && textOf(caption[1])) || attr(ring.attrs, 'aria-label') || attr(ring.attrs, 'aria-labelledby')
      || attr(list.attrs, 'aria-label') || attr(list.attrs, 'aria-labelledby');
    if (!named) problems.push(`${label} has no name: give it a figcaption, or aria-label or aria-labelledby on the ring or its list`);
    if (!/^(ol|ul)$/.test(list.tag)) problems.push(`${label}'s cells sit in a <${list.tag}>; they are an ordered list (<ol>)`);

    const items = topItems(list.inner);
    if (items.length !== 7) problems.push(`${label} has ${items.length} cells; it has the centre and six around it`);
    items.forEach((li, i) => {
      if (i === 0) {
        const centre = elementsWithClass(li.inner, 'vc-ring__centre')[0];
        if (!centre) { problems.push(`${label}'s first cell is not its centre (.vc-ring__centre): the centre comes first in the markup`); return; }
        const name = elementsWithClass(centre.inner, 'vc-ring__name')[0];
        if (!name || !textOf(name.inner)) problems.push(`${label}'s centre has no name (.vc-ring__name)`);
        return;
      }
      const where = `${label}, cell ${i}`;
      if (elementsWithClass(li.inner, 'vc-ring__centre').length) problems.push(`${where} is a second centre; only the first cell is the centre`);
      const cell = elementsWithClass(li.inner, 'vc-ring__cell')[0];
      if (!cell) { problems.push(`${where} has no .vc-ring__cell`); return; }
      const name = elementsWithClass(cell.inner, 'vc-ring__name')[0];
      const nameText = name ? textOf(name.inner) : '';
      const at = nameText ? `${label}, cell ${i} "${nameText.slice(0, 30)}"` : where;
      if (!nameText) problems.push(`${where} has no name (.vc-ring__name)`);
      if (cell.tag === 'button' && attr(cell.attrs, 'type') !== 'button') problems.push(`${at} is a button without type="button"`);
      const status = attr(cell.attrs, 'data-status');
      if (status === undefined) return;
      if (!RING_STATUSES.includes(status)) { problems.push(`${at} has data-status="${status}"; it is pressure, watch or addressed, or absent`); return; }
      const state = elementsWithClass(cell.inner, 'vc-ring__state')[0];
      if (!state || !textOf(state.inner)) problems.push(`${at} is ${STATE_WORDS[status]} but has no word for it (.vc-ring__state)`);
      else if (!hasIcon(state.inner)) problems.push(`${at} is ${STATE_WORDS[status]} but its word "${textOf(state.inner)}" has no mark (.vc-icon)`);
    });
  });
  return problems;
}
