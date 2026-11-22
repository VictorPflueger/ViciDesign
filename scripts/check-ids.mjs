#!/usr/bin/env node
// The names-not-ids rule: a prototype's screen shows names, places and words, never the ids its data
// carries. Vici's own pages have no data, so the rule binds the prototypes built on Vici; they import
// recordIdProblems() from scripts/lib/ids.mjs and run it over the text of every screen with the ids of
// their own data. This check proves the function: it catches planted ids in text and in HTML, leaves
// alone ids inside a longer token, attributes, scripts and comments, and passes a page with names only.
import { recordIdProblems } from './lib/ids.mjs';

export { recordIdProblems };

const IDS = ['10003', '10004', 'RA-CISCO', 'CC-1000', '549300LKFJ962MZ46593', 'AY'];
const page = (body) => `<!doctype html><html lang="en-GB"><body>${body}</body></html>`;
const named = page('<h2>Splunk bills on its own account</h2><p>The Cisco agreement pays 2&nbsp;% once purchases reach €50M; Frankfurt books €100,030.</p>');
const planted = {
  'an account number in a sentence': page('<p>Vendor 10003 has no group key.</p>'),
  'an agreement id in a heading': page('<h2>RA-CISCO: rebate missed</h2>'),
  'a company code in a table cell': page('<table><tr><td>CC-1000</td><td>€52.4M</td></tr></table>'),
  'an LEI in a source line': page('<li>GLEIF record 549300LKFJ962MZ46593</li>'),
  'an id in plain text': 'Meraki (10004) and Acacia',
};
const hidden = page('<p data-vendor="10003" title="RA-CISCO">Meraki</p><!-- 10004 --><script>const id = "CC-1000";</script><p>RA-CISCO-2 and x10003 are other tokens.</p>');
const selfFailures = [];
const p = recordIdProblems(named, IDS);
if (p.length) selfFailures.push(`a screen with names only was rejected: ${p.join('; ')}`);
const h = recordIdProblems(hidden, IDS);
if (h.length) selfFailures.push(`ids that never reach the screen, or inside longer tokens, were reported: ${h.join('; ')}`);
for (const [name, screen] of Object.entries(planted)) if (!recordIdProblems(screen, IDS).length) selfFailures.push(`missed: ${name}`);
if (recordIdProblems(page('<p>AY</p>'), IDS).length) selfFailures.push('an id shorter than three characters was reported');
if (selfFailures.length) {
  console.error(selfFailures.map((f) => `self-test failed: ${f}`).join('\n'));
  process.exit(1);
}
const n = Object.keys(planted).length;
console.log(`Self-test caught ${n}/${n} planted ids, passed a screen with names only, and left alone attributes, comments, scripts and longer tokens.`);
console.log('RECORD IDS OK');
