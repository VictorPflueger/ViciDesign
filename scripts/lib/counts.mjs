// A count opens what it counts (components/data.html#count) as a pure function, so a prototype's own tests can
// import it: import { countProblems } from '<ViciDesign>/scripts/lib/counts.mjs'. scripts/check-counts.mjs runs
// it with a self-test over every page and starter; scripts/check-dialog-render.mjs opens the Data page's count
// in a browser.
//
// A count is a .vc-count, or a stat card that is a button (button.vc-stat). Each must be a button with
// type="button" (or a link to a place on the page), hold its number in its text and name what it opens with
// data-vc-open, aria-controls or href="#…", and that element must be on the page.

const attr = (attrs, name) => (attrs.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ').replace(/\s+/g, ' ').trim();

/** The page's counts: every element with the class vc-count and every stat card that is a button. */
export function countsOf(html) {
  const page = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|pre|code)\b[\s\S]*?<\/\1>/g, '');
  const out = [];
  // Opening tags only, so a count inside another element with a class is still found.
  for (const m of page.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
    const [whole, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    const classes = (attr(attrs, 'class') || '').split(/\s+/);
    const isCount = classes.includes('vc-count');
    const isStat = classes.includes('vc-stat') && tag === 'button';
    if (!isCount && !isStat) continue;
    const start = m.index + whole.length;
    const end = page.toLowerCase().indexOf(`</${tag}>`, start);
    out.push({ tag, attrs, text: words(page.slice(start, end < 0 ? start : end)), kind: isCount ? 'count' : 'stat card' });
  }
  return out;
}

/** Problems with the page's counts; empty when each is a button with its number that opens a set on the page. */
export function countProblems(html) {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const out = [];
  for (const c of countsOf(html)) {
    const name = `${c.kind} "${c.text.slice(0, 40)}"`;
    const link = c.tag === 'a' && /^#./.test(attr(c.attrs, 'href') || '');
    if (c.tag !== 'button' && !link) { out.push(`${name} is a <${c.tag}>, not a button: a keyboard can't reach it`); continue; }
    if (c.tag === 'button' && attr(c.attrs, 'type') !== 'button') out.push(`${name} needs type="button"`);
    if (!/\d/.test(c.text)) out.push(`${name} holds no number`);
    const target = attr(c.attrs, 'data-vc-open') || attr(c.attrs, 'aria-controls') || (link ? attr(c.attrs, 'href').slice(1) : '');
    if (!target) out.push(`${name} names nothing it opens (data-vc-open, aria-controls or href="#…")`);
    else if (!ids.has(target)) out.push(`${name} opens "${target}", which isn't on the page`);
  }
  return out;
}
