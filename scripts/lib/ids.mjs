// The names-not-ids rule as a pure function, so a prototype's own tests can import it without running
// the docs checks: import { recordIdProblems } from '<ViciDesign>/scripts/lib/ids.mjs'.
// scripts/check-ids.mjs proves it with a self-test.
//
// A prototype's data carries ids: vendor 10003, agreement RA-CISCO, company code CC-1000, an LEI. The
// visitor knows those things by name, so the screen says Meraki, the Cisco agreement and Frankfurt, and
// the ids stay in the data, the engine, the tools and the logs (see the Writing guideline, Names, not
// record ids). The prototype hands this function what a screen shows, as text or as HTML, and the ids
// of its own data; every id that still reaches the screen comes back as a problem.

/** What a visitor reads in an HTML page: no comments, scripts, styles, code, attributes or entities. */
export function visibleText(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|template|code|pre|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Problems with record ids on a screen; an empty list means the screen shows names only.
 * screen: the text a screen shows, or its HTML (anything with a tag is read as HTML).
 * ids: the ids of the prototype's data. An id counts only as a whole token, so "RA-CISCO" is not found
 * in "RA-CISCO-2" and "10003" not in "€100,030"; ids shorter than `min` characters are left out.
 */
export function recordIdProblems(screen, ids, { min = 3 } = {}) {
  const text = /<[a-z!/][^>]*>/i.test(String(screen)) ? visibleText(screen) : String(screen).replace(/\s+/g, ' ');
  const wanted = [...new Set([...ids].map(String).filter((id) => id.trim().length >= min))].sort((a, b) => b.length - a.length);
  if (!wanted.length) return [];
  const re = new RegExp(`(?<![\\p{L}\\p{N}_-])(${wanted.map(escape).join('|')})(?![\\p{L}\\p{N}_-])`, 'gu');
  const out = [];
  const seen = new Set();
  for (const m of text.matchAll(re)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    const around = text.slice(Math.max(0, m.index - 30), m.index + m[1].length + 30).trim();
    out.push(`record id "${m[1]}" on screen: "${around}"`);
  }
  return out;
}
