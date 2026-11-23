// The risk matrix's rules as a pure function, so a prototype's own tests can import it without running
// the docs checks: import { riskMatrixProblems, band } from '<ViciDesign>/scripts/lib/risk.mjs'.
// scripts/check-risk.mjs proves it with a self-test and runs it on the Data display page.
//
// A risk matrix (components/data.html#risk-matrix) places issues by impact and likelihood, both 1 to 5.
// Each cell's band follows impact × likelihood: low 1 to 4, medium 5 to 9, high 10 to 15, critical 16
// to 25. The rule: 25 cells, each pair of impact and likelihood once, every cell in its band and showing
// its score, every marker in a cell that matches its own impact and likelihood, a key that names all
// four bands in words, and a table of the numbers one click away.

/** The band of a score: impact × likelihood, each 1 to 5. */
export function band(score) {
  if (!Number.isInteger(score) || score < 1 || score > 25) throw new RangeError(`a score is 1 to 25, got ${score}`);
  return score <= 4 ? 'low' : score <= 9 ? 'medium' : score <= 15 ? 'high' : 'critical';
}
export const BANDS = ['low', 'medium', 'high', 'critical'];

const textOf = (html) => String(html).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z#0-9]+;/gi, 'x').replace(/\s+/g, ' ').trim();
const hasClass = (attrs, name) => new RegExp(`\\bclass\\s*=\\s*["'][^"']*(?<![\\w-])${name}(?![\\w-])`).test(attrs);
const attr = (attrs, name) => (attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`)) || [])[1];

/** Every element with the given class: its attributes and inner HTML (same-tag nesting counted). */
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
    out.push({ attrs: m[2], inner: html.slice(start, end) });
  }
  return out;
}

/** Problems with every risk matrix in a screen's markup; an empty list means each keeps the rule. */
export function riskMatrixProblems(html) {
  const source = String(html).replace(/<!--[\s\S]*?-->/g, ' ');
  const figures = elementsWithClass(source, 'vc-risk');
  const problems = [];
  figures.forEach((fig, i) => {
    const where = figures.length > 1 ? `risk matrix ${i + 1}` : 'the risk matrix';
    if (!/<figcaption\b[\s\S]*?\S[\s\S]*?<\/figcaption>/i.test(fig.inner) && !attr(fig.attrs, 'aria-label') && !attr(fig.attrs, 'aria-labelledby')) problems.push(`${where} has no caption or label`);
    const cells = elementsWithClass(fig.inner, 'vc-risk__cell');
    if (cells.length !== 25) problems.push(`${where} has ${cells.length} cells; it has 25, five by five`);
    const seen = new Set();
    for (const cell of cells) {
      const impact = Number(attr(cell.attrs, 'data-impact'));
      const likelihood = Number(attr(cell.attrs, 'data-likelihood'));
      const at = `impact ${attr(cell.attrs, 'data-impact')}, likelihood ${attr(cell.attrs, 'data-likelihood')}`;
      if (![1, 2, 3, 4, 5].includes(impact) || ![1, 2, 3, 4, 5].includes(likelihood)) { problems.push(`${where}: a cell has ${at}; both are 1 to 5`); continue; }
      if (seen.has(at)) problems.push(`${where}: the cell at ${at} appears twice`);
      seen.add(at);
      const want = band(impact * likelihood);
      if (attr(cell.attrs, 'data-band') !== want) problems.push(`${where}: the cell at ${at} is in band "${attr(cell.attrs, 'data-band') ?? ''}"; its score ${impact * likelihood} is ${want}`);
      const score = elementsWithClass(cell.inner, 'vc-risk__score')[0];
      if (!score || textOf(score.inner) !== String(impact * likelihood)) problems.push(`${where}: the cell at ${at} does not show its score ${impact * likelihood}`);
      for (const marker of elementsWithClass(cell.inner, 'vc-risk__marker')) {
        const mi = attr(marker.attrs, 'data-impact');
        const ml = attr(marker.attrs, 'data-likelihood');
        if ((mi !== undefined && Number(mi) !== impact) || (ml !== undefined && Number(ml) !== likelihood)) problems.push(`${where}: the marker "${textOf(marker.inner)}" (impact ${mi}, likelihood ${ml}) sits in the cell at ${at}`);
        if (!textOf(marker.inner) && !attr(marker.attrs, 'aria-label')) problems.push(`${where}: a marker at ${at} has no label`);
      }
    }
    const loose = elementsWithClass(fig.inner, 'vc-risk__marker').length - cells.reduce((n, c) => n + elementsWithClass(c.inner, 'vc-risk__marker').length, 0);
    if (loose > 0) problems.push(`${where}: ${loose} marker${loose === 1 ? '' : 's'} outside any cell`);
    const key = elementsWithClass(fig.inner, 'vc-risk__key')[0];
    const named = key ? [...key.inner.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi)].filter((m) => textOf(m[2])).map((m) => attr(m[1], 'data-band')) : [];
    const unnamed = BANDS.filter((b) => !named.includes(b));
    if (unnamed.length) problems.push(`${where}: the key does not name ${unnamed.join(', ')} in words`);
    if (!/<table\b/i.test(fig.inner)) problems.push(`${where} has no table of its numbers`);
  });
  return problems;
}
