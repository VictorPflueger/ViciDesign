// The Writing guideline's checkable rules as a pure function, so a prototype's own tests can import
// it without running the docs checks: import { writingProblems } from '<ViciDesign>/scripts/lib/writing.mjs'.
// scripts/check-docs.mjs runs it with a self-test over every page and starter.
import { read } from './files.mjs';

const WORDS = JSON.parse(read('src/docs/banned-words.json'));
export const BANNED = WORDS.groups.filter((g) => g.check !== false).flatMap((g) => g.words);
const ALLOW = new Set((WORDS.allow || []).map((w) => w.toLowerCase()));
const forms = (w) => (w.includes(' ') ? [w] : [w, w + 's', w + 'es', w + 'd', w + 'ed', w + 'ing', w.replace(/e$/, '') + 'ing', w + 'ly']);
const STOCK = new RegExp(`\\b(${[...new Set(BANNED.flatMap(forms))].filter((f) => !ALLOW.has(f.toLowerCase())).map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]")).join('|')})\\b`, 'i');
const snippet = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);

/** Problems with one page against the Writing guideline's checkable rules; empty when it keeps them. */
export function writingProblems(html) {
  const out = [];
  // Tables marked data-doc-banned show the banned patterns on purpose (the Writing page).
  const page = html.replace(/<table\b[^>]*\bdata-doc-banned\b[\s\S]*?<\/table>/g, '');
  if (/class="[^"]*\bvc-eyebrow\b/.test(page)) out.push('uses an eyebrow (.vc-eyebrow)');
  if (/class="[^"]*\bvc-bg-aurora\b/.test(page)) out.push('uses the aurora background (.vc-bg-aurora)');
  const numbered = page.match(/<h[1-6]\b[^>]*>\s*\d+\s*·[^<]*/);
  if (numbered) out.push(`numbered heading "${snippet(numbered[0])}"`);
  const label = page.match(/<li\b[^>]*>\s*<strong>[^<]{1,40}(?::<\/strong>|<\/strong>\s*(?:\((?:<code>)?[^<)]*(?:<\/code>)?\)\s*)?:)/);
  if (label) out.push(`list item starts with a bold label and a colon: "${snippet(label[0])}"`);
  const visible = page
    .replace(/<!--[\s\S]*?-->/g, '\n')
    .replace(/<(script|style|pre|code|svg)\b[\s\S]*?<\/\1>/g, '\n')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&(?:[a-z]+|#\d+);/gi, ' ');
  const dash = visible.match(/.{0,30}[^\s] ?— ?[^\s].{0,30}/);
  if (dash) out.push(`em dash as punctuation: "${dash[0].trim()}"`);
  const word = visible.match(STOCK);
  if (word) out.push(`stock word "${word[1]}" (see guidelines/writing.html#stock-words)`);
  return out;
}
