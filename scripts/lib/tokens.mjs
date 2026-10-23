// Loads src/tokens/tokens.json, flattens it to dotted paths and resolves {references}.
import { readFileSync } from 'node:fs';

export const TOKENS_URL = new URL('../../src/tokens/tokens.json', import.meta.url);

export function loadTokens() {
  return JSON.parse(readFileSync(TOKENS_URL, 'utf8'));
}

/** Flatten to { 'color.merlot.950': { value, type, description } }, inheriting group $type. */
export function flatten(node, path = [], inheritedType, out = {}) {
  const type = node.$type ?? inheritedType;
  if (Object.prototype.hasOwnProperty.call(node, '$value')) {
    out[path.join('.')] = { value: node.$value, type, description: node.$description };
    return out;
  }
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$') || child === null || typeof child !== 'object') continue;
    flatten(child, [...path, key], type, out);
  }
  return out;
}

const REF = /^\{([^}]+)\}$/;

export function resolve(flat, value, seen = new Set()) {
  if (typeof value !== 'string') return value;
  const m = value.match(REF);
  if (!m) return value;
  const target = m[1];
  if (seen.has(target)) throw new Error(`Circular token reference: ${[...seen, target].join(' -> ')}`);
  if (!flat[target]) throw new Error(`Unknown token reference: {${target}}`);
  seen.add(target);
  return resolve(flat, flat[target].value, seen);
}

export function resolvedTheme(tokens, name) {
  const flat = flatten(tokens);
  const out = {};
  for (const [path, tok] of Object.entries(flat)) {
    const prefix = `theme.${name}.`;
    if (path.startsWith(prefix)) out[path.slice(prefix.length)] = resolve(flat, tok.value);
  }
  return out;
}
