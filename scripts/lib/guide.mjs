// The How it works rule as a pure function, so a prototype's own tests can import it without running
// the docs checks: import { guideProblems } from '<ViciDesign>/scripts/lib/guide.mjs'.
// scripts/check-guide.mjs runs it with a self-test over the starters. It also holds the key-figure rule:
// the How it works chapter explains every tile marked data-vc-kpi="<name>" in a table row of its own,
// whose header names the figure and whose cells say what it measures and its value; and keyFigureProblems,
// which guideProblems runs too: a figure that covers part of the data on purpose (data-vc-part) says under
// its value, in a vc-stat__also line, what lies lower outside that part; and a cost figure that is an
// estimate says what a live run would cost and that the replay costs nothing.
//
// A page in two languages carries one guide per language: each dialog says its language in lang, no two
// share one, each follows the whole standard, has its own header button and a title in its language, and
// gives every key figure its row under the figure's name in that language (data-vc-kpi-<lang>, such as
// data-vc-kpi-de, where the tile has one, else data-vc-kpi).

const TITLES = {
  en: /^How the (prototype|demo|challenge|showcase) works$/,
  de: /^So funktioniert (der Prototyp|die Demo|die Challenge|der Showcase)$/
};
const TITLE = new RegExp(`^(${Object.values(TITLES).map((r) => r.source.slice(1, -1)).join('|')})$`);
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
/** The primary language of a lang attribute, lower case: "en-GB" gives "en"; null without one. */
const primary = (attrs) => ((attrs.match(/\blang="([^"]+)"/) || [])[1] || '').split('-')[0].toLowerCase() || null;

/**
 * Problems with the key figures themselves, wherever the guide is: a figure that covers part of the data on
 * purpose (data-vc-part="<the part>") says under its value what lies lower outside that part, in a
 * vc-stat__also line (components/guide.html#key-figures), so it never contradicts the screen.
 */
export function keyFigureProblems(html) {
  const out = [];
  const words = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  for (const m of html.matchAll(/<(article|div|section|button|p)\b([^>]*\bclass="[^"]*\bvc-stat\b[^"]*"[^>]*)>/g)) {
    const [, tag, attrs] = m;
    const name = (attrs.match(/\bdata-vc-kpi="([^"]+)"/) || attrs.match(/\bdata-vc-part="([^"]+)"/) || [])[1] || 'a stat card';
    const start = m.index + m[0].length;
    // The tile's own content: up to its closing tag, counting nested tags of the same name.
    let depth = 1;
    let end = start;
    const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'g');
    re.lastIndex = start;
    for (let t; depth && (t = re.exec(html)); ) { depth += t[1] ? -1 : 1; end = t.index; }
    const body = html.slice(start, end);
    if (/\bdata-vc-part="[^"]+"/.test(attrs) && !/\bclass="[^"]*\bvc-stat__also\b/.test(body)) out.push(`key figure "${name}" covers part of the data (data-vc-part) but has no vc-stat__also line to say what lies outside it`);
    // Session cost in a simulation never reads as money spent: an estimate says it is what a live run would
    // cost and that the replay costs nothing (components/guide.html#key-figures).
    const names = [...attrs.matchAll(/\bdata-vc-kpi(?:-[a-z]{2})?="([^"]+)"/g)].map((x) => x[1]).join(' ');
    const said = words(body);
    if (/\bcosts?\b|kosten/i.test(names) && /estimat|simulat|replay|geschätzt|simuliert|wiedergabe/i.test(said)) {
      if (!/live run|live-lauf/i.test(said)) out.push(`key figure "${name}" is an estimate but doesn't say it is what a live run would cost`);
      if (!/(€\s?0(?![.,]?\d)|\b0\s?€|costs nothing|kostet nichts|free\b|kostenlos)/i.test(said)) out.push(`key figure "${name}" is an estimate but doesn't say the replay costs nothing ("this replay: €0")`);
    }
  }
  return out;
}

/** Problems with the guide in one HTML page; an empty list means it follows the standard. */
export function guideProblems(html) {
  const guide = guideOnly(html);
  return [...guide, ...keyFigureProblems(html)];
}

function guideOnly(html) {
  const dialogs = [...html.matchAll(/<dialog\b([^>]*\bclass="[^"]*\bvc-guide\b[^"]*"[^>]*)>([\s\S]*?)<\/dialog>/g)];
  if (!dialogs.length) return ['no How it works guide'];
  if (dialogs.length === 1) {
    const page = primary((html.match(/<html\b([^>]*)>/) || [])[1] || '');
    return oneGuide(html, dialogs[0], primary(dialogs[0][1]) || page, false);
  }
  const langs = dialogs.map(([, attrs]) => primary(attrs));
  if (langs.some((l) => !l) || new Set(langs).size !== langs.length) {
    return [`${dialogs.length} guides, expected one, or one per language, each saying its own language in lang`];
  }
  return dialogs.flatMap((d, i) => {
    const id = (d[1].match(/\bid="([^"]+)"/) || [])[1] || '?';
    return oneGuide(html, d, langs[i], true).map((p) => `guide "${id}" (${langs[i]}): ${p}`);
  });
}

/** One guide's problems; `lang` is its primary language, `several` true on a page with one per language. */
function oneGuide(html, [, attrs, body], lang, several) {
  const out = [];
  const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
  if (!/\bdata-vc-guide\b/.test(attrs)) out.push('dialog lacks data-vc-guide');
  if (!/\bdata-vc-guide-auto\b/.test(attrs)) out.push('guide does not open by itself (data-vc-guide-auto)');
  const labelled = (attrs.match(/\baria-labelledby="([^"]+)"/) || [])[1];
  const title = labelled ? (body.match(new RegExp(`<h2\\b[^>]*id="${labelled}"[^>]*>([\\s\\S]*?)</h2>`)) || [])[1] : null;
  if (!title) out.push('no title labelling the dialog');
  else if (!TITLE.test(text(title))) out.push(`title "${text(title)}" breaks the pattern`);
  else if (several && TITLES[lang] && !TITLES[lang].test(text(title))) out.push(`title "${text(title)}" is not in the guide's language (${lang})`);
  if (/vc-eyebrow/.test(body)) out.push('eyebrow inside the guide');
  const chapters = [...body.matchAll(/<section\b([^>]*\bclass="[^"]*\bvc-guide__chapter\b[^"]*"[^>]*)>([\s\S]*?)<\/section>/g)]
    .map(([, a, b]) => ({ id: (a.match(/\bdata-vc-chapter="([^"]+)"/) || [])[1], nav: (a.match(/\bdata-vc-nav="([^"]+)"/) || [])[1], body: b }));
  if (chapters.length < 3 || chapters.length > 8) out.push(`${chapters.length} chapters, needs 3 to 8`);
  if (chapters.length) {
    if (chapters[0].id !== 'what') out.push('first chapter is not "what"');
    if (chapters[1] && chapters[1].id !== 'how') out.push('second chapter is not "how"');
    if (chapters.at(-1).id !== 'present') out.push('last chapter is not "present"');
  }
  for (const c of chapters) {
    const where = `chapter "${c.id || '?'}"`;
    if (!c.id) out.push('a chapter without data-vc-chapter');
    if (!c.nav || c.nav.split(/\s+/).length > 5) out.push(`${where}: rail label missing or longer than five words`);
    const heads = [...c.body.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)];
    if (heads.length !== 1) out.push(`${where}: ${heads.length} headings, needs one`);
    else if (text(heads[0][1]).length > 60) out.push(`${where}: heading longer than 60 characters`);
    const leads = [...c.body.matchAll(/<p\b[^>]*class="[^"]*\bvc-guide__lead\b[^"]*"[^>]*>([\s\S]*?)<\/p>/g)];
    if (leads.length !== 1) out.push(`${where}: ${leads.length} leads, needs one`);
    else if (text(leads[0][1]).split(' ').length > 40) out.push(`${where}: lead longer than 40 words`);
    // a table inside a figure counts once
    const tables = (c.body.match(/<table\b/g) || []).length;
    const figures = (c.body.match(/<figure\b/g) || []).length;
    const lists = (c.body.match(/<(ul|ol|dl)\b/g) || []).length;
    const parts = figures + lists + (figures ? 0 : tables);
    if (parts > 1) out.push(`${where}: more than one figure, table or list`);
    for (const l of c.body.matchAll(/<(ul|ol|dl)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
      if (/vc-guide__path/.test(l[2])) continue;
      const items = (l[3].match(/<(li|dt)\b/g) || []).length;
      if (items > 5) out.push(`${where}: a list of ${items} items, at most five`);
    }
  }
  const present = chapters.find((c) => c.id === 'present');
  if (present) {
    const path = (present.body.match(/<ol\b[^>]*class="[^"]*\bvc-guide__path\b[^"]*"[^>]*>([\s\S]*?)<\/ol>/) || [])[1];
    if (!path) out.push('presenting chapter has no ol.vc-guide__path');
    else {
      const steps = [...path.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
      if (steps.length < 3 || steps.length > 7) out.push(`presenting path has ${steps.length} steps, needs 3 to 7`);
      steps.forEach((s, i) => {
        if (!/class="vc-guide__time"[^>]*>\s*\d+([.,]\d+)?\s*min\b/.test(s)) out.push(`presenting step ${i + 1} has no time in minutes`);
        if (!/[“"„][^“”"„]{3,}[”"“]/.test(text(s))) out.push(`presenting step ${i + 1} has no sentence to say in quotation marks`);
      });
    }
  }
  // Key figures: the How it works chapter explains every tile marked data-vc-kpi="<name>" in a table row
  // of its own: the row's header names the figure, and its cells say what it measures and its value. The
  // name is the one in the guide's language, data-vc-kpi-<lang>, where the tile has one.
  const plain = (s) => s.toLowerCase().replace(/&[a-z#0-9]+;/gi, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const how = chapters.find((c) => c.id === 'how');
  const rows = how ? [...how.body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]) : [];
  for (const [tag, kpi] of html.matchAll(/<[^>]*\bdata-vc-kpi="([^"]+)"[^>]*>/g)) {
    const name = (lang && (tag.match(new RegExp(`\\bdata-vc-kpi-${lang}="([^"]+)"`)) || [])[1]) || kpi;
    const row = rows.find((r) => {
      const head = r.match(/<th\b[^>]*>([\s\S]*?)<\/th>/);
      return head && plain(text(head[1])) === plain(name);
    });
    if (!row) out.push(`key figure "${name}" has no row in the How it works chapter`);
    else if ((row.match(/<td\b/g) || []).length < 2) out.push(`key figure "${name}": its row needs what it measures and its value`);
  }
  if (!/data-vc-guide-next\b/.test(body) || !/data-vc-guide-back\b/.test(body) || !/class="vc-guide__count"/.test(body)) out.push('footer lacks Back, Next or the count');
  if (id) {
    const opener = html.match(new RegExp(`<button\\b[^>]*data-vc-guide-open="${id}"[^>]*>([\\s\\S]*?)</button>`));
    if (!opener) out.push('no header button that opens the guide');
    else if (!text(opener[1].replace(/<[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/[^>]+>/g, ''))) out.push('the button that opens the guide has no visible text');
  } else out.push('guide has no id');
  return out;
}
