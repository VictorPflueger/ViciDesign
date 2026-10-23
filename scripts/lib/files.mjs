// Small file helpers shared by the check scripts.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const SKIP = /^(\.git|node_modules|\.unlazy)$/;

/** All files under dir (relative to ROOT, POSIX separators) that match the filter. */
export function listFiles(dir = '', filter = () => true) {
  const out = [];
  const walk = (rel) => {
    for (const entry of readdirSync(join(ROOT, rel))) {
      if (SKIP.test(entry)) continue;
      const r = rel ? `${rel}/${entry}` : entry;
      const abs = join(ROOT, r);
      if (statSync(abs).isDirectory()) walk(r);
      else if (filter(r)) out.push(r.split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

export const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

/** Generated documentation pages and starters. */
export function sitePages() {
  return listFiles('', (r) => r.endsWith('.html') && !r.startsWith('src/') && !r.startsWith('dist/') && !r.startsWith('assets/'));
}

export function rel(abs) {
  return relative(ROOT, abs).split(sep).join('/');
}
