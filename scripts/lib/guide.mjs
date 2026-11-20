// The How it works rule as a pure function, so a prototype's own tests can import it without running
// the docs checks: import { guideProblems } from '<ViciDesign>/scripts/lib/guide.mjs'.
// scripts/check-guide.mjs runs it with a self-test over the starters. It also holds the key-figure rule:
// the How it works chapter explains every tile marked data-vc-kpi="<name>" in a table row of its own,
// whose header names the figure and whose cells say what it measures and its value.

const TITLE = /^(How the (prototype|demo|challenge|showcase) works|So funktioniert (der Prototyp|die Demo|die Challenge|der Showcase))$/;
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

/** Problems with the guide in one HTML page; an empty list means it follows the standard. */
export function guideProblems(html) {
  const out = [];
  const dialogs = [...html.matchAll(/<dialog\b([^>]*\bclass="[^"]*\bvc-guide\b[^"]*"[^>]*)>([\s\S]*?)<\/dialog>/g)];
  if (dialogs.length !== 1) return [dialogs.length ? `${dialogs.length} guides, expected one` : 'no How it works guide'];
  const [, attrs, body] = dialogs[0];
  const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
  if (!/\bdata-vc-guide\b/.test(attrs)) out.push('dialog lacks data-vc-guide');
  if (!/\bdata-vc-guide-auto\b/.test(attrs)) out.push('guide does not open by itself (data-vc-guide-auto)');
  const labelled = (attrs.match(/\baria-labelledby="([^"]+)"/) || [])[1];
  const title = labelled ? (body.match(new RegExp(`<h2\\b[^>]*id="${labelled}"[^>]*>([\\s\\S]*?)</h2>`)) || [])[1] : null;
  if (!title) out.push('no title labelling the dialog');
  else if (!TITLE.test(text(title))) out.push(`title "${text(title)}" breaks the pattern`);
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
  // of its own: the row's header names the figure, and its cells say what it measures and its value.
  const plain = (s) => s.toLowerCase().replace(/&[a-z#0-9]+;/gi, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const how = chapters.find((c) => c.id === 'how');
  const rows = how ? [...how.body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]) : [];
  for (const [, name] of html.matchAll(/\bdata-vc-kpi="([^"]+)"/g)) {
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
