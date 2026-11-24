// The report's rule as a pure function, so a prototype's own tests can import it without running the docs
// checks: import { reportProblems } from '<ViciDesign>/scripts/lib/report.mjs'.
// scripts/check-report.mjs proves it with a self-test and runs it on the Report page; the render check
// scripts/check-report-print.mjs prints the page's example and finds the footer on every page.
//
// A report (components/report.html) is the document a run ends in. It names its language and keeps the
// light theme, since it ends on paper. Its first page is a cover whose first heading is the title
// (vc-report__title) and the report's one top heading: an h1 in a file of its own, one level below the
// heading around it inside a page. Every page after the cover opens with a heading one level below the title.
// Nothing in it needs a pointer or a script to be read: no script, no button or form field, and no closed
// details, whose content would not print. Its fixed footer, for browsers without margin boxes, names Victor
// Pflüger, and its last page carries the complete byline. Every picture is named in words.

import { bylineProblems, profile } from './byline.mjs';

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

const tagsOf = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'gi'))].map((m) => ({ attrs: m[1], at: m.index }));

/**
 * Problems with the reports in one piece of markup; an empty list means every report keeps the rule. A page
 * with no report at all returns ['no report'].
 */
export function reportProblems(html, p = profile) {
  const reports = elementsWithClass(String(html).replace(/<!--[\s\S]*?-->/g, ''), 'vc-report');
  if (!reports.length) return ['no report'];
  const problems = [];
  reports.forEach((r, i) => {
    const label = reports.length > 1 ? `report ${i + 1}` : 'the report';
    const inner = r.inner;
    if (!attr(r.attrs, 'lang')) problems.push(`${label} names no language (lang)`);
    if (attr(r.attrs, 'data-theme') !== 'light') problems.push(`${label} does not keep the light theme (data-theme="light")`);
    const pages = elementsWithClass(inner, 'vc-report__page');
    if (pages.some((pg) => elementsWithClass(pg.inner, 'vc-report__page').length)) problems.push(`${label} has a page inside a page`);
    if (pages.length < 2) problems.push(`${label} has ${pages.length} page${pages.length === 1 ? '' : 's'}; a report has a cover and at least one more`);
    if (pages.length) {
      const cover = pages[0];
      if (!hasClass(cover.attrs, 'vc-report__cover')) problems.push(`${label} does not open with its cover (vc-report__cover)`);
      const headings = [...inner.matchAll(/<h([1-6])\b([^>]*)>/gi)].map((m) => ({ level: Number(m[1]), attrs: m[2], at: m.index }));
      const title = [...cover.inner.matchAll(/<h([1-6])\b([^>]*)>/gi)][0];
      if (!title) problems.push(`${label}'s cover has no title`);
      else {
        const level = Number(title[1]);
        if (!hasClass(title[2], 'vc-report__title')) problems.push(`${label}'s cover opens with a heading that is not its title (vc-report__title)`);
        const top = headings.filter((h) => h.level <= level).length;
        if (top !== 1) problems.push(`${label} has ${top} headings at the title's level (h${level}) or above; the title is its one top heading`);
        pages.slice(1).forEach((pg, n) => {
          const first = (pg.inner.match(/<h([1-6])\b/i) || [])[1];
          if (Number(first) !== level + 1) problems.push(`${label}'s page ${n + 2} opens ${first ? `with an h${first}` : 'without a heading'}; it needs an h${level + 1}, one level below the title`);
        });
      }
      const last = pages[pages.length - 1];
      const byline = bylineProblems(last.inner, p);
      if (byline.length) problems.push(`${label}'s last page lacks a complete byline: ${byline.join('; ')}`);
    }
    if (/<script\b/i.test(inner)) problems.push(`${label} holds a script`);
    const controls = ['button', 'input', 'select', 'textarea'].filter((tag) => tagsOf(inner, tag).length);
    if (controls.length) problems.push(`${label} holds controls a printed page can't use: ${controls.join(', ')}`);
    const closed = tagsOf(inner, 'details').filter((d) => !hasAttr(d.attrs, 'open'));
    if (closed.length) problems.push(`${label} holds ${closed.length} closed details, whose content would not print`);
    const footer = elementsWithClass(inner, 'vc-report__footer')[0];
    if (!footer) problems.push(`${label} has no fixed footer (vc-report__footer) for browsers without margin boxes`);
    else if (!textOf(footer.inner).includes(p.name)) problems.push(`${label}'s fixed footer does not name ${p.name}`);
    const images = tagsOf(inner, 'img').filter((img) => attr(img.attrs, 'alt') === undefined);
    if (images.length) problems.push(`${label} has ${images.length} image${images.length === 1 ? '' : 's'} without alt`);
    const svgs = tagsOf(inner, 'svg').filter((s) => !/aria-hidden\s*=\s*["']true/.test(s.attrs) && !(attr(s.attrs, 'role') === 'img' && (attr(s.attrs, 'aria-label') || attr(s.attrs, 'aria-labelledby'))));
    if (svgs.length) problems.push(`${label} has ${svgs.length} picture${svgs.length === 1 ? '' : 's'} (svg) without role="img" and a name`);
  });
  return problems;
}
