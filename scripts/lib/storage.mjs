// The session-only data rule as pure functions, so a prototype's own tests can import them without
// running the docs checks: import { storageProblems, storedKeyProblems } from
// '<ViciDesign>/scripts/lib/storage.mjs'. scripts/check-storage.mjs runs them with a self-test.
//
// A prototype holds an API key, everything a person enters or uploads and everything its agents make in
// memory only. None of it goes to local storage, session storage, IndexedDB, the Cache API or a cookie,
// into a URL, a log or an export, and all of it is gone when the tab closes or reloads. A result leaves
// the page only as a download the person starts. Three keys may persist, and none of them holds data:
// Vici's theme choice (vc-theme), the prototype's language choice (<prefix>.lang) and Vici's note that
// the guide has opened in this tab (vc-guide:…, in session storage).

/** Local and session storage: a prototype reaches them only through the modules allowed them. */
const WEB_STORAGE = /\b(localStorage|sessionStorage)\b/;

/** Stores no prototype uses at all. */
const NEVER = [
  [/\bindexedDB\b|\bIDBFactory\b/, 'IndexedDB'],
  [/\bcaches\s*\.\s*(?:open|match|has|keys|delete)\b|\bCacheStorage\b/, 'the Cache API'],
  [/\bdocument\s*\.\s*cookie\b|\bcookieStore\b/, 'cookies'],
];

/** A string literal that names a store whole, as in window['localStorage'], is kept so the check sees it. */
const STORE_NAME = /^(?:localStorage|sessionStorage|indexedDB|cookie|cookieStore|caches)$/;

/** The keys that may persist for a prototype whose own keys start with `prefix`, such as "pestel". */
export function allowedKeys(prefix) {
  if (!/^[a-z][a-z0-9]*$/.test(prefix || '')) {
    throw new Error(`a storage prefix is lower-case letters and digits, such as "pestel"; got ${JSON.stringify(prefix)}`);
  }
  // vc-guide: is the start of a key: Vici adds the page's path and the guide's id.
  return { local: ['vc-theme', `${prefix}.lang`], session: ['vc-guide:'] };
}

// Where a "/" starts a regular expression rather than a division: after these characters or keywords.
const REGEX_AFTER = /(?:^|[(,=:[!&|?{};+\-*%<>~^]|\breturn|\btypeof|\bcase|\bdo|\belse|\bin|\bof|\bvoid|\bdelete|\bnew|\bthrow|\byield|\bawait)\s*$/;

/**
 * JavaScript without its comments and with every string, template text and regular expression emptied,
 * so a store named in a comment or a message doesn't count and one used in code does. Code inside a
 * template's ${…} is kept. A string that names a store whole is kept (bracket access).
 */
export function codeOnly(js) {
  let out = '';
  let i = 0;
  const n = js.length;
  const takeString = (quote) => {
    // i is on the opening quote; returns the string's text and moves i past the closing quote.
    let j = i + 1;
    let text = '';
    while (j < n && js[j] !== quote) {
      if (js[j] === '\\') { text += js[j + 1] ?? ''; j += 2; continue; }
      if (js[j] === '\n' && quote !== '`') break; // an unterminated string ends at the line
      if (quote === '`' && js[j] === '$' && js[j + 1] === '{') {
        let depth = 1;
        let k = j + 2;
        while (k < n && depth) {
          if (js[k] === '{') depth++;
          else if (js[k] === '}') depth--;
          k++;
        }
        out += codeOnly(js.slice(j + 2, k - 1)) + ' ';
        j = k;
        continue;
      }
      text += js[j];
      j++;
    }
    i = j + 1;
    return text;
  };
  while (i < n) {
    const c = js[i];
    const d = js[i + 1];
    if (c === '/' && d === '/') { while (i < n && js[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const end = js.indexOf('*/', i + 2); i = end < 0 ? n : end + 2; out += ' '; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const text = takeString(c);
      out += `${c}${STORE_NAME.test(text) ? text : ''}${c}`;
      continue;
    }
    if (c === '/' && REGEX_AFTER.test(out)) {
      let j = i + 1;
      let inClass = false;
      while (j < n && js[j] !== '\n') {
        if (js[j] === '\\') { j += 2; continue; }
        if (js[j] === '[') inClass = true;
        else if (js[j] === ']') inClass = false;
        else if (js[j] === '/' && !inClass) break;
        j++;
      }
      if (js[j] === '/') {
        j++;
        while (j < n && /[a-z]/i.test(js[j])) j++;
        out += '/r/';
        i = j;
        continue;
      }
    }
    out += c;
    i++;
  }
  return out;
}

/** The code of an HTML page's inline script elements; a script with src is checked as its own file. */
export function inlineScripts(html) {
  return [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1]).join('\n;\n');
}

/**
 * Problems with where a prototype's scripts touch browser storage; an empty list means it keeps the rule.
 * `sources` maps each path to its text: .js and .mjs files whole, HTML pages by their inline scripts.
 * `allow` lists the paths that may use local or session storage, usually the theme script and the module
 * that remembers the language. IndexedDB, the Cache API and cookies are allowed nowhere.
 */
export function storageProblems(sources, { allow = [] } = {}) {
  const problems = [];
  for (const [path, text] of Object.entries(sources)) {
    const code = codeOnly(/\.html?$/i.test(path) ? inlineScripts(text) : text);
    for (const [re, what] of NEVER) if (re.test(code)) problems.push(`${path} uses ${what}, which a prototype never does`);
    const web = code.match(WEB_STORAGE);
    if (web && !allow.includes(path)) {
      problems.push(`${path} uses ${web[1]}, but only ${allow.length ? allow.join(', ') : 'no module'} may`);
    }
  }
  return problems;
}

/**
 * Problems with what a page left in the browser after a full run; an empty list means only the allowed
 * keys persisted. Read them in a fresh browser context, since all of Victor's sites share one origin:
 * { local: localStorage keys, session: sessionStorage keys, databases: indexedDB.databases() names,
 *   caches: caches.keys(), cookie: document.cookie }.
 */
export function storedKeyProblems({ local = [], session = [], databases = [], caches = [], cookie = '' } = {}, { prefix } = {}) {
  const allowed = allowedKeys(prefix);
  const problems = [];
  for (const k of local) if (!allowed.local.includes(k)) problems.push(`local storage holds "${k}"`);
  for (const k of session) if (!allowed.session.some((start) => k.startsWith(start))) problems.push(`session storage holds "${k}"`);
  for (const d of databases) problems.push(`IndexedDB holds a database named "${d}"`);
  for (const c of caches) problems.push(`the Cache API holds "${c}"`);
  if (String(cookie).trim()) problems.push('the page set a cookie');
  return problems;
}
