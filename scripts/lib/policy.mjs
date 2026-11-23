// A page under a strict security policy, as a pure function, so a prototype's own tests can import it:
// import { policyProblems } from '<ViciDesign>/scripts/lib/policy.mjs'. scripts/check-policy.mjs runs it
// with a self-test over the blank starter.
//
// Victor's prototypes carry a content security policy in a meta tag that lets in only their own scripts
// and styles. Under it the browser runs no inline script, no style attribute or element and no event
// handler written into the markup. So the page has none of them, because whatever the browser blocks is a
// feature that silently isn't there.

/** The policy a page's meta tags carry: the content of each Content-Security-Policy meta. */
export function policiesOf(html) {
  return [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/gi)]
    .map((m) => (m[0].match(/\bcontent\s*=\s*"([^"]*)"/i) || m[0].match(/\bcontent\s*=\s*'([^']*)'/i) || [])[1] ?? '');
}

/** A policy as a map from directive to its sources. */
export function directives(policy) {
  const out = {};
  for (const part of String(policy).split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) out[name.toLowerCase()] = sources;
  }
  return out;
}

const LOOSE = ["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", '*', 'data:', 'blob:', 'http:', 'https:'];
const DATA_BLOCK = /^(application\/(ld\+)?json|text\/template)$/i;

/** Problems with one HTML page under a strict policy; an empty list means it keeps the rule. */
export function policyProblems(html) {
  const problems = [];
  const policies = policiesOf(html);
  if (!policies.length) problems.push('the page carries no Content-Security-Policy meta tag');
  if (policies.length > 1) problems.push(`the page carries ${policies.length} Content-Security-Policy meta tags; one holds the whole policy`);
  const d = directives(policies[0] || '');
  for (const kind of ['script-src', 'style-src']) {
    const sources = d[kind] || d['default-src'];
    if (!sources) { problems.push(`the policy sets neither ${kind} nor default-src`); continue; }
    const loose = sources.filter((s) => LOOSE.includes(s.toLowerCase()));
    if (loose.length) problems.push(`${kind} lets in ${loose.join(' ')}`);
  }
  const markup = html.replace(/<!--[\s\S]*?-->/g, ' ');
  for (const m of markup.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '';
    if (!/\bsrc\s*=/i.test(attrs) && !DATA_BLOCK.test(type) && m[2].trim()) problems.push(`an inline script runs: ${m[2].trim().slice(0, 60)}`);
  }
  // Tags only, with script contents removed, so code that mentions an attribute doesn't count.
  const tags = markup.replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2').match(/<[a-zA-Z][^>]*>/g) || [];
  for (const tag of tags) {
    const name = tag.match(/^<([a-zA-Z0-9-]+)/)[1].toLowerCase();
    if (name === 'style') problems.push('a style element');
    if (/\sstyle\s*=/i.test(tag)) problems.push(`a style attribute on <${name}>`);
    const handler = tag.match(/\s(on[a-z]+)\s*=/i);
    if (handler) problems.push(`an event handler in the markup: ${handler[1]} on <${name}>`);
    if (/\s(href|src|action|formaction)\s*=\s*["']?\s*javascript:/i.test(tag)) problems.push(`a javascript: address on <${name}>`);
  }
  return problems;
}
