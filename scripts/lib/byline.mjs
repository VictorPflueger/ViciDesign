// The byline rule as a pure function, so a prototype's own tests can import it without running the
// docs checks: import { bylineProblems, profile } from '<ViciDesign>/scripts/lib/byline.mjs'.
// scripts/check-byline.mjs runs it with a self-test over every page and starter.
import { read } from './files.mjs';

/** Name, LinkedIn, GitHub and website: the one source for every byline (src/brand/profile.json). */
export const profile = JSON.parse(read('src/brand/profile.json'));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Problems with the bylines in one HTML page; an empty list means at least one complete byline. */
export function bylineProblems(html, p = profile) {
  const blocks = [];
  for (const m of html.matchAll(/<p\b[^>]*class="[^"]*\bvc-byline\b[^"]*"[^>]*>([\s\S]*?)<\/p>/g)) blocks.push(m[1]);
  if (!blocks.length) return ['no byline'];
  const linkTo = (block, href) => [...block.matchAll(new RegExp(`<a\\b[^>]*href="${esc(href)}"[^>]*>`, 'g'))].map((m) => m[0]);
  const reasons = [];
  for (const b of blocks) {
    const why = [];
    if (!/Built by|Erstellt von/.test(b)) why.push('no "Built by" ("Erstellt von" on a German page)');
    if (!b.includes(p.name)) why.push(`does not name ${p.name}`);
    const li = linkTo(b, p.linkedin);
    if (!li.length) why.push('no link to LinkedIn');
    else if (!li.some((a) => /\brel="[^"]*\bauthor\b/.test(a))) why.push('LinkedIn link without rel="author"');
    const web = linkTo(b, p.website);
    if (!web.length) why.push('no link to the website');
    else {
      if (!web.some((a) => /\brel="[^"]*\bauthor\b/.test(a))) why.push('website link without rel="author"');
      if (!web.some((a) => /\baria-label(ledby)?="[^"]+"/.test(a))) why.push('website link without an accessible name');
    }
    if (!why.length) return [];
    reasons.push(why.join(', '));
  }
  return reasons;
}
