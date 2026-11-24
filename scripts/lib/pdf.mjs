// The text of each page of a PDF that Chromium prints, read without a library: enough to prove that a
// running footer stands on every page (the report pattern's render check, and the prototypes' own report
// tests). It inflates the page streams, maps each font's glyph codes to text through its ToUnicode map,
// and joins the strings the page shows, a line break where the text moves to another line. It reads the
// PDFs Chromium writes; it is not a general PDF parser.
import { inflateSync } from 'node:zlib';

/** Every indirect object of the file: { num, dict, stream } with the stream inflated where it can be. */
function objects(bytes) {
  const text = bytes.toString('latin1');
  const out = new Map();
  const re = /(\d+)\s+0\s+obj\b/g;
  let m;
  while ((m = re.exec(text))) {
    const num = Number(m[1]);
    const start = m.index + m[0].length;
    const end = text.indexOf('endobj', start);
    if (end < 0) break;
    const body = text.slice(start, end);
    const s = body.indexOf('stream');
    let dict = body;
    let stream = null;
    if (s >= 0 && /^\s*<</.test(body)) {
      dict = body.slice(0, s);
      let from = start + s + 'stream'.length;
      if (text[from] === '\r') from += 1;
      if (text[from] === '\n') from += 1;
      const lenMatch = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
      const to = lenMatch ? from + Number(lenMatch[1]) : text.indexOf('endstream', from);
      let raw = bytes.subarray(from, to);
      if (/\/FlateDecode/.test(dict)) {
        try { raw = inflateSync(raw); } catch { raw = null; }
      }
      stream = raw;
    }
    out.set(num, { num, dict, stream });
    re.lastIndex = end;
  }
  return out;
}

const ref = (dict, key) => {
  const m = dict.match(new RegExp(`/${key}\\s+(\\d+)\\s+0\\s+R`));
  return m ? Number(m[1]) : null;
};

/** A font's ToUnicode map: glyph code (hex, as written) to text. */
function toUnicode(cmap) {
  const map = new Map();
  const hexText = (h) => {
    let s = '';
    for (let i = 0; i + 4 <= h.length; i += 4) s += String.fromCharCode(parseInt(h.slice(i, i + 4), 16));
    return s;
  };
  for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const p of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) map.set(p[1].toUpperCase(), hexText(p[2]));
  }
  for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const p of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<([0-9A-Fa-f]+)>|\[([^\]]*)\])/g)) {
      const lo = parseInt(p[1], 16);
      const hi = parseInt(p[2], 16);
      const width = p[1].length;
      const key = (n) => n.toString(16).toUpperCase().padStart(width, '0');
      if (p[4]) {
        const base = parseInt(p[4], 16);
        for (let n = lo; n <= hi; n += 1) map.set(key(n), String.fromCharCode(base + (n - lo)));
      } else {
        const list = [...p[5].matchAll(/<([0-9A-Fa-f]+)>/g)].map((x) => hexText(x[1]));
        for (let n = lo; n <= hi; n += 1) map.set(key(n), list[n - lo] ?? '');
      }
    }
  }
  return map;
}

/** The fonts a page's resources name: font name to its ToUnicode map and code width. */
function fontsOf(page, objs) {
  let res = page.dict;
  const resRef = ref(page.dict, 'Resources');
  if (resRef !== null) res = objs.get(resRef)?.dict || '';
  let fontDict = (res.match(/\/Font\s*<<([\s\S]*?)>>/) || [])[1] || '';
  const fontRef = ref(res, 'Font');
  if (!fontDict && fontRef !== null) fontDict = objs.get(fontRef)?.dict || '';
  const fonts = new Map();
  for (const f of fontDict.matchAll(/\/([A-Za-z0-9_.+-]+)\s+(\d+)\s+0\s+R/g)) {
    const font = objs.get(Number(f[2]));
    if (!font) continue;
    const tu = ref(font.dict, 'ToUnicode');
    const cmap = tu !== null && objs.get(tu)?.stream ? toUnicode(objs.get(tu).stream.toString('latin1')) : new Map();
    const width = [...cmap.keys()][0]?.length || 4;
    fonts.set(f[1], { cmap, width });
  }
  return fonts;
}

/** The text a content stream shows, a line break where the line changes. */
function showText(content, fonts) {
  let font = null;
  let out = '';
  let lastY = null;
  const decode = (hex) => {
    if (!font) return '';
    let s = '';
    for (let i = 0; i + font.width <= hex.length; i += font.width) s += font.cmap.get(hex.slice(i, i + font.width).toUpperCase()) ?? '';
    return s;
  };
  const tokens = content.match(/\/[^\s/<>[\]()]+|<[0-9A-Fa-f\s]*>|\[[^\]]*\]|\((?:\\.|[^\\)])*\)|-?\d*\.?\d+|[A-Za-z'"*]+/g) || [];
  const stack = [];
  for (const tok of tokens) {
    if (/^[A-Za-z'"*]+$/.test(tok)) {
      if (tok === 'Tf') font = fonts.get(String(stack[stack.length - 2] || '').slice(1)) || null;
      else if (tok === 'Tm' || tok === 'Td' || tok === 'TD') {
        const y = Number(stack[stack.length - 1]);
        if (tok === 'Tm' ? lastY !== null && Math.abs(y - lastY) > 0.5 : Math.abs(y) > 0.5) out += '\n';
        else if (out && !/\s$/.test(out)) out += ' ';
        if (tok === 'Tm') lastY = y;
      } else if (tok === 'T*') out += '\n';
      else if (tok === 'Tj' || tok === "'" || tok === '"') {
        const s = stack[stack.length - 1] || '';
        if (s.startsWith('<')) out += decode(s.slice(1, -1).replace(/\s+/g, ''));
      } else if (tok === 'TJ') {
        const arr = stack[stack.length - 1] || '';
        for (const part of arr.matchAll(/<([0-9A-Fa-f\s]*)>|(-?\d*\.?\d+)/g)) {
          if (part[1] !== undefined) out += decode(part[1].replace(/\s+/g, ''));
          else if (Number(part[2]) < -200) out += ' ';
        }
      } else if (tok === 'ET') out += '\n';
      stack.length = 0;
    } else {
      stack.push(tok);
    }
  }
  return out;
}

/** The text of every page, in page order. */
export function pdfPageTexts(bytes) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const objs = objects(buf);
  // Page order: follow the page tree from the catalog's Pages, depth first.
  const catalog = [...objs.values()].find((o) => /\/Type\s*\/Catalog\b/.test(o.dict));
  const order = [];
  const walk = (num, seen = new Set()) => {
    if (seen.has(num)) return;
    seen.add(num);
    const o = objs.get(num);
    if (!o) return;
    if (/\/Type\s*\/Pages\b/.test(o.dict)) {
      const kids = (o.dict.match(/\/Kids\s*\[([^\]]*)\]/) || [])[1] || '';
      for (const k of kids.matchAll(/(\d+)\s+0\s+R/g)) walk(Number(k[1]), seen);
    } else if (/\/Type\s*\/Page\b/.test(o.dict)) order.push(num);
  };
  const root = catalog ? ref(catalog.dict, 'Pages') : null;
  if (root !== null) walk(root);
  return order.map((num) => {
    const page = objs.get(num);
    const fonts = fontsOf(page, objs);
    const contents = [];
    const one = ref(page.dict, 'Contents');
    if (one !== null) contents.push(one);
    else for (const k of ((page.dict.match(/\/Contents\s*\[([^\]]*)\]/) || [])[1] || '').matchAll(/(\d+)\s+0\s+R/g)) contents.push(Number(k[1]));
    const text = contents.map((c) => objs.get(c)?.stream?.toString('latin1') || '').map((s) => showText(s, fonts)).join('\n');
    return text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  });
}
