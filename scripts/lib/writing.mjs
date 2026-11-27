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
// Short forms: hover only adds. A title shows on hover alone, which a projector, a touch screen and a
// keyboard never bring up. On a control it can repeat the control's name; on anything else its text lives
// nowhere on the screen. Frames and the document's own elements need their title for another purpose.
const TITLE_OK = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary', 'label', 'iframe', 'frame', 'object', 'embed', 'link', 'style', 'meta', 'area']);
// A tooltip (role="tooltip") shows on hover and on focus; on an element that takes no focus a pointer alone
// brings it up, so it hangs on a control or on an element with a tabindex (components/overlays.html).
const FOCUSABLE = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary', 'iframe']);

/** Problems with one page against the Writing guideline's checkable rules; empty when it keeps them. */
export function writingProblems(html) {
  const out = [];
  // Tables marked data-doc-banned show the banned patterns on purpose (the Writing page).
  const page = html.replace(/<table\b[^>]*\bdata-doc-banned\b[\s\S]*?<\/table>/g, '');
  if (/class="[^"]*\bvc-eyebrow\b/.test(page)) out.push('uses an eyebrow (.vc-eyebrow)');
  if (/class="[^"]*\bvc-bg-aurora\b/.test(page)) out.push('uses the aurora background (.vc-bg-aurora)');
  const hover = [...page.matchAll(/<([a-z][\w-]*)\b[^>]*?\stitle="([^"]*)"/gi)].find((m) => !TITLE_OK.has(m[1].toLowerCase()) && m[2].trim());
  if (hover) out.push(`text on hover only: title "${snippet(hover[2])}" on <${hover[1].toLowerCase()}> (see guidelines/writing.html#short-forms)`);
  const tips = new Map([...page.matchAll(/<([a-z][\w-]*)\b([^>]*\brole="tooltip"[^>]*)>([\s\S]*?)<\/\1>/gi)]
    .map((m) => [(m[2].match(/\bid="([^"]+)"/) || [])[1], m[3]]).filter(([id]) => id));
  for (const m of page.matchAll(/<([a-z][\w-]*)\b([^>]*\baria-(?:describedby|labelledby)="([^"]+)"[^>]*)>/gi)) {
    const [, tag, attrs, ids] = m;
    const tip = ids.split(/\s+/).find((id) => tips.has(id));
    if (!tip) continue;
    const focusable = (FOCUSABLE.has(tag.toLowerCase()) && (tag.toLowerCase() !== 'a' || /\shref=/.test(attrs))) || /\stabindex="(?:0|[1-9]\d*)"/.test(attrs) || /\scontenteditable(?:="true")?[\s>]/.test(attrs);
    if (!focusable) { out.push(`text on hover only: tooltip "${snippet(tips.get(tip))}" on <${tag.toLowerCase()}>, which takes no focus (see components/overlays.html#tooltip)`); break; }
  }
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
  // A backslash before a quote is an escape that leaked out of a script or a string into the text.
  const escaped = visible.match(/.{0,30}\\['"’].{0,30}/);
  if (escaped) out.push(`escaped quote in the text: "${escaped[0].trim()}"`);
  return out;
}
