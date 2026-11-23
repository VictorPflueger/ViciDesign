#!/usr/bin/env node
// The session-only data rule: a prototype keeps an API key, what a person enters and what its agents make
// in memory only, and only vc-theme, <prefix>.lang and Vici's vc-guide: note may persist. Prototypes
// import storageProblems() and storedKeyProblems() from scripts/lib/storage.mjs. A self-test first proves
// that the checker catches planted mistakes and passes code that keeps the rule. Then it holds Vici to
// the rule too: vici.js keeps only the theme and the guide note and vici-theme.js reads only the theme,
// under the keys the rule allows, and no other script of Vici's, the docs' demo of a key held in memory
// included, touches storage at all.
import { read, listFiles } from './lib/files.mjs';
import { storageProblems, storedKeyProblems, allowedKeys, codeOnly, inlineScripts } from './lib/storage.mjs';

export { storageProblems, storedKeyProblems };

// ------------------------------------------------------------------ self-test
const theme = "(function(){try{var t=localStorage.getItem('vc-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}})();";
const good = {
  'js/theme.js': theme,
  'js/lang.js': "export function remember(l){try{localStorage.setItem('pestel.lang',l)}catch{}}",
  'js/session.js': "// Nothing here goes to localStorage or sessionStorage.\nlet key = null;\nexport const setKey = (k) => { key = k; };\nconst note = 'localStorage is blocked, so the theme is not remembered';",
  'index.html': '<script src="js/theme.js"></script><!-- <script>localStorage.clear()</script> -->',
};
const allow = ['js/theme.js', 'js/lang.js'];
const planted = {
  'the key written to local storage': { 'js/keystore.js': "export function save(k){ localStorage.setItem('key', k); }" },
  'session storage in a module not allowed it': { 'js/run.js': 'sessionStorage.setItem("run", JSON.stringify(run));' },
  'storage reached by its name in brackets': { 'js/run.js': "const s = window['localStorage']; s.setItem('x', 1);" },
  'storage inside a template expression': { 'js/report.js': 'const t = `${localStorage.getItem("draft")}`;' },
  'storage after a regular expression with a quote in it': { 'js/run.js': "const q = /[\"']/g; localStorage.setItem('k', v);" },
  'IndexedDB': { 'js/lang.js': "indexedDB.open('runs');" },
  'the Cache API': { 'js/sw.js': "caches.open('v1').then((c) => c.put(req, res));" },
  'a cookie': { 'js/theme.js': "document.cookie = 'theme=dark';" },
  'an inline script in a page': { 'index.html': '<script>sessionStorage.setItem("step", 3)</script>' },
};
const keysGood = { local: ['vc-theme', 'pestel.lang'], session: ['vc-guide:/PESTEL-challenger/#guide-en'], databases: [], caches: [], cookie: '' };
const keysPlanted = {
  'an API key left in local storage': { local: ['vc-theme', 'pestel.apiKey'] },
  'a run kept in session storage': { session: ['vc-guide:/x/#guide', 'pestel.run'] },
  'a database': { databases: ['runs'] },
  'a cache': { caches: ['v1'] },
  'a cookie': { cookie: 'theme=dark' },
};
const selfFailures = [];
const okGood = storageProblems(good, { allow });
if (okGood.length) selfFailures.push(`code that keeps the rule was rejected: ${okGood.join('; ')}`);
for (const [name, sources] of Object.entries(planted)) if (!storageProblems(sources, { allow }).length) selfFailures.push(`missed: ${name}`);
if (storedKeyProblems(keysGood, { prefix: 'pestel' }).length) selfFailures.push('the allowed keys were rejected');
for (const [name, keys] of Object.entries(keysPlanted)) if (!storedKeyProblems(keys, { prefix: 'pestel' }).length) selfFailures.push(`missed in storage: ${name}`);
if (!/\/r\//.test(codeOnly('const a = b ? /x\\/y/ : 1;')) || /store/.test(codeOnly('// store\nconst s = "store";'))) selfFailures.push('codeOnly() kept a comment or a string, or lost a regular expression');
let refused = false;
try { allowedKeys('Pestel Challenger'); } catch { refused = true; }
if (!refused) selfFailures.push('allowedKeys() took a prefix with capitals and a space');
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length + Object.keys(keysPlanted).length;
if (process.argv.includes('--self-test')) {
  console.log(`Self-test caught ${n}/${n} planted mistakes and passed code and keys that keep the rule.`);
  console.log('STORAGE SELF-TEST OK');
  process.exit(0);
}

// ------------------------------------------------------------------ Vici's own scripts
const failures = [];
const vici = read('src/js/vici.js');
// The keys vici.js writes are the ones the rule lets every prototype keep.
const themeKey = (vici.match(/var STORAGE_KEY = '([^']+)'/) || [])[1];
const guideKey = (vici.match(/var key = '([^']+)' \+ window\.location\.pathname/) || [])[1];
const allowed = allowedKeys('prototype');
if (!allowed.local.includes(themeKey)) failures.push(`src/js/vici.js keeps the theme under "${themeKey}", which the rule does not allow`);
if (!allowed.session.includes(guideKey)) failures.push(`src/js/vici.js keeps the guide note under "${guideKey}", which the rule does not allow`);
// vici.js and the pages' theme line may read and write those keys; nothing else of Vici's touches storage.
const sources = {};
for (const f of listFiles('src', (r) => /\.(m?js|html)$/.test(r))) sources[f] = read(f);
const themeLines = Object.keys(sources).filter((f) => /\.html$/.test(f) && /localStorage\.getItem\('vc-theme'\)/.test(inlineScripts(sources[f])));
const themeFileKey = (read('src/js/vici-theme.js').match(/localStorage\.getItem\('([^']+)'\)/) || [])[1];
if (!allowed.local.includes(themeFileKey)) failures.push(`src/js/vici-theme.js reads the theme from "${themeFileKey}", which the rule does not allow`);
failures.push(...storageProblems(sources, { allow: ['src/js/vici.js', 'src/js/vici-theme.js', ...themeLines] }));
if (failures.length) {
  console.error(failures.map((f) => '✗ ' + f).join('\n'));
  console.error(`\n${failures.length} storage problem(s)`);
  process.exit(1);
}
console.log(`Self-test caught ${n}/${n} planted mistakes.`);
console.log(`${Object.keys(sources).length} source files: vici.js keeps only "${themeKey}" and "${guideKey}…", vici-theme.js and ${themeLines.length} page${themeLines.length === 1 ? '' : 's'} read the theme, nothing else touches storage.`);
console.log('STORAGE OK');
