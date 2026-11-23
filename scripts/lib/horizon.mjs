// The horizon strip's rule as a pure function, so a prototype's own tests can import it without running the
// docs checks: import { horizonProblems } from '<ViciDesign>/scripts/lib/horizon.mjs'.
// scripts/check-horizon.mjs proves it with a self-test and runs it on the Data display page.
//
// A horizon strip (components/data.html#horizon) shows when issues arrive: lanes for spans of time, left
// to right, each holding the numbered markers of the risk matrix. The rule: the strip has a name; it has
// two to six lanes, each naming its span in words; a lane with no issue says so in words; every marker is
// an image named in words that carry its number, and sits in one lane only; markers sized by what they
// put at stake have the sizes named in a key; and the numbers sit in a table.

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

/** Every element with the given class inside a piece of markup: its tag, attributes and inner HTML. */
function elementsWithClass(html, name) {
  const out = [];
  for (const m of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    if (!hasClass(m[2], name)) continue;
    const tag = m[1].toLowerCase();
    const start = m.index + m[0].length;
    const re = new RegExp(`<${tag}\\b[^>]*>|</${tag}\\s*>`, 'gi');
    re.lastIndex = start;
    let depth = 1;
    let end = html.length;
    for (let n = re.exec(html); n; n = re.exec(html)) {
      depth += n[0][1] === '/' ? -1 : 1;
      if (!depth) { end = n.index; break; }
    }
    out.push({ tag, attrs: m[2], inner: html.slice(start, end) });
  }
  return out;
}

const SIZES = ['sm', 'lg'];

/**
 * Problems with the horizon strips in a screen's markup; an empty list means every strip has a name, two
 * to six lanes that name their span, every marker named once in one lane, its sizes keyed and its numbers
 * in a table.
 */
export function horizonProblems(html) {
  const source = String(html).replace(/<!--[\s\S]*?-->/g, ' ');
  const problems = [];
  elementsWithClass(source, 'vc-horizon').forEach((strip, s) => {
    const where = `horizon strip ${s + 1}`;
    const caption = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i.exec(strip.inner);
    const named = (caption && textOf(caption[1])) || attr(strip.attrs, 'aria-label') || attr(strip.attrs, 'aria-labelledby');
    if (!named) problems.push(`${where} has no name: give it a figcaption, or aria-label or aria-labelledby`);

    const lists = elementsWithClass(strip.inner, 'vc-horizon__lanes');
    if (lists.length !== 1) { problems.push(`${where} has ${lists.length} lane lists (.vc-horizon__lanes); it has one`); return; }
    if (lists[0].tag !== 'ol') problems.push(`${where}'s lanes sit in a <${lists[0].tag}>; they are an ordered list (<ol>), earliest first`);
    const lanes = elementsWithClass(lists[0].inner, 'vc-horizon__lane');
    if (lanes.length < 2 || lanes.length > 6) problems.push(`${where} has ${lanes.length} lane(s); it has two to six`);

    const seen = new Map();
    const sized = new Set();
    lanes.forEach((lane, l) => {
      const label = elementsWithClass(lane.inner, 'vc-horizon__label')[0];
      const name = label ? textOf(label.inner) : '';
      const at = name ? `${where}, lane "${name.slice(0, 30)}"` : `${where}, lane ${l + 1}`;
      if (!name) problems.push(`${at} does not name its span (.vc-horizon__label)`);
      const markers = elementsWithClass(lane.inner, 'vc-risk__marker');
      const empty = elementsWithClass(lane.inner, 'vc-horizon__empty')[0];
      if (!markers.length && !(empty && textOf(empty.inner))) problems.push(`${at} holds no issue and does not say so (.vc-horizon__empty)`);
      for (const m of markers) {
        const number = textOf(m.inner);
        const words = attr(m.attrs, 'aria-label') ?? '';
        if (!number) problems.push(`${at} has a marker without a number`);
        if (attr(m.attrs, 'role') !== 'img') problems.push(`${at}: marker ${number || '?'} is not an image (role="img")`);
        if (!words.trim()) problems.push(`${at}: marker ${number || '?'} has no name in words (aria-label)`);
        else if (number && !new RegExp(`(^|\\D)${number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\D|$)`).test(words)) problems.push(`${at}: marker ${number} is named "${words}", which leaves out its number`);
        if (number && !hasClass(m.attrs, 'vc-risk__marker--residual')) {
          if (seen.has(number)) problems.push(`${where}: issue ${number} sits in two lanes, "${seen.get(number)}" and "${name}"`);
          else seen.set(number, name);
        }
        for (const size of SIZES) if (hasClass(m.attrs, `vc-risk__marker--${size}`)) sized.add(size);
      }
    });

    if (sized.size) {
      const key = elementsWithClass(strip.inner, 'vc-risk__key')[0];
      const keyed = key ? [...key.inner.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi)].filter((m) => textOf(m[2])).map((m) => attr(m[1], 'data-size')) : [];
      const missing = [...sized].filter((size) => !keyed.includes(size));
      if (missing.length) problems.push(`${where}: markers are sized ${missing.join(' and ')}, but no key (.vc-risk__key) names ${missing.length === 1 ? 'that size' : 'those sizes'} in words`);
    }
    if (!/<table\b/i.test(strip.inner)) problems.push(`${where} has no table of its numbers`);
  });
  return problems;
}
