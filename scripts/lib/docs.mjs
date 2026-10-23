// Renders the documentation site from src/docs. Pages are HTML partials with a front-matter
// comment; the build wraps them in src/docs/layout.html, turns <!-- demo --> blocks into live
// previews with copyable code, and replaces <!-- @widget --> markers with tables and swatches
// computed from the tokens — so the docs can never drift from the system.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolve } from './tokens.mjs';
import { contrast, hexToOklch, deltaOk, simulate } from './color.mjs';
import { logoMarkSvg, viciWordmarkSvg } from './logos.mjs';

const SECTIONS = ['Start', 'Guidelines', 'Components', 'Brand'];

const SEMANTIC_NOTES = {
  bg: 'Page canvas',
  'bg-subtle': 'Alternate sections, sidebars, table headers',
  'bg-sunken': 'Wells and code blocks',
  surface: 'Cards, inputs, panels',
  'surface-raised': 'Menus, dialogs, toasts',
  'surface-hover': 'Hover state of neutral items',
  'surface-pressed': 'Pressed state of neutral items',
  'surface-selected': 'Selected rows and items',
  'surface-inverse': 'Tooltips and inverted chips',
  scrim: 'Dialog backdrop (used at 55%)',
  text: 'Body text and headings',
  'text-muted': 'Secondary text, labels',
  'text-subtle': 'Placeholders, meta text',
  'text-disabled': 'Disabled text (exempt from contrast rules)',
  'text-inverse': 'Text on inverse surfaces',
  'text-link': 'Links',
  'text-link-hover': 'Links on hover',
  'border-subtle': 'Dividers, card outlines',
  border: 'Default borders',
  'border-strong': 'Input outlines, unchecked controls (≥ 3:1)',
  accent: 'Primary actions, checked controls',
  'accent-hover': 'Primary hover',
  'accent-pressed': 'Primary pressed',
  'on-accent': 'Text and icons on accent',
  'accent-soft': 'Secondary actions, chips, highlights',
  'accent-soft-hover': 'Secondary hover',
  'on-accent-soft': 'Text on accent-soft',
  'accent-text': 'Brand-coloured text and icons',
  focus: 'Focus rings (≥ 3:1 on every surface)',
  'shadow-color': 'Tint of all shadows',
  rating: 'Filled rating cells',
  knob: 'Switch knob',
  track: 'Progress and slider tracks',
  'chart-grid': 'Chart gridlines',
  'chart-axis': 'Chart axis labels',
};

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The plain-text LICENSE as HTML, word for word: the file wraps at 80 columns, so its lines are
 *  joined into paragraphs that reflow on a phone. A heading underlined with dashes becomes a bold
 *  line (the dashes go), "- " items become a list, and a block of short lines keeps its breaks. */
export function licenceHtml(text) {
  const blocks = text.trim().split(/\n(?:[ \t]*\n)+/).map((b) => b.split('\n').map((l) => l.trimEnd())).filter((b) => b.some((l) => l.trim()));
  return blocks.map((lines) => {
    if (lines.length === 2 && /^-{3,}$/.test(lines[1].trim())) return `<p class="doc-licence__heading">${esc(lines[0].trim())}</p>`;
    if (/^\s*- /.test(lines[0])) {
      const items = [];
      for (const l of lines) {
        if (/^\s*- /.test(l)) items.push(l.replace(/^\s*- /, ''));
        else items[items.length - 1] += ' ' + l.trim();
      }
      return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    }
    if (lines.length > 1 && lines.every((l) => l.trim().length < 40)) return `<p>${lines.map((l) => esc(l.trim())).join('<br>')}</p>`;
    return `<p>${esc(lines.map((l) => l.trim()).join(' '))}</p>`;
  }).join('\n');
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function dedent(text) {
  const lines = text.replace(/^\n+|\s+$/g, '').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}

/** Tiny HTML highlighter: tags, attribute names, attribute values, comments. */
function highlight(code) {
  let out = '';
  let i = 0;
  const re = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>/g;
  let m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(i, m.index));
    const tok = m[0];
    if (tok.startsWith('<!--')) {
      out += `<span class="tk-comment">${esc(tok)}</span>`;
    } else {
      const parts = tok.match(/^<(\/?)([a-zA-Z0-9-]+)([\s\S]*?)(\/?)>$/);
      if (!parts) { out += esc(tok); i = re.lastIndex; continue; }
      const [, slash, name, attrs, selfClose] = parts;
      const attrsHtml = attrs.replace(/([^\s=]+)(=)?("[^"]*"|'[^']*')?/g, (all, n, eq, v) => {
        if (!n.trim()) return esc(all);
        return `<span class="tk-attr">${esc(n)}</span>${eq ? '=' : ''}${v ? `<span class="tk-str">${esc(v)}</span>` : ''}`;
      });
      out += `<span class="tk-punct">&lt;${slash}</span><span class="tk-tag">${name}</span>${attrsHtml}<span class="tk-punct">${selfClose}&gt;</span>`;
    }
    i = re.lastIndex;
  }
  return out + esc(code.slice(i));
}

function frontMatter(src) {
  const m = src.match(/^<!--\n([\s\S]*?)\n-->\n?/);
  const meta = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv) meta[kv[1]] = kv[2].trim();
    }
  }
  return { meta, body: m ? src.slice(m[0].length) : src };
}

function walk(dir, base = '') {
  const out = [];
  for (const entry of readdirSync(join(dir, base)).sort()) {
    const rel = base ? `${base}/${entry}` : entry;
    if (statSync(join(dir, rel)).isDirectory()) out.push(...walk(dir, rel));
    else if (entry.endsWith('.html')) out.push(rel);
  }
  return out;
}

// label ink for a swatch: white or merlot, or black where neither reaches 4.5:1 (a few mid-tones)
const readable = (hex) => {
  const w = contrast(hex, '#ffffff');
  const m = contrast(hex, '#250010');
  if (Math.max(w, m) >= 4.5) return w >= m ? '#ffffff' : '#250010';
  return contrast(hex, '#000000') >= w ? '#000000' : '#ffffff';
};


// ---------------------------------------------------------------- charts
// Small, dependency-free SVG charts used by the docs and the starters. Colours come from the
// theme tokens through CSS variables, so every chart follows light and dark mode.
const n1 = (x) => Math.round(x * 10) / 10;
const hexPts = (cx, cy, r, pointy = false) =>
  [0, 60, 120, 180, 240, 300].map((a) => {
    const t = ((a + (pointy ? 30 : 0)) * Math.PI) / 180;
    return `${n1(cx + r * Math.cos(t))},${n1(cy + r * Math.sin(t))}`;
  }).join(' ');

export const CHARTS = {
  // Charts with text are drawn at the width they are shown at (an argument, default 600),
  // so their 11 px labels are never scaled; .vc-chart__plot scrolls when the column is narrower.
  bars(arg) {
    const cats = ['Q1', 'Q2', 'Q3', 'Q4'];
    const series = [
      { name: 'Hardware', values: [42, 48, 45, 58] },
      { name: 'Services', values: [30, 36, 44, 52] },
      { name: 'Software', values: [18, 24, 31, 40] },
    ];
    const W = Number(arg) || 600, H = 260, L = 40, B = 30, T = 12, R = 8;
    const max = 60;
    const ih = H - T - B;
    const y = (v) => T + ih - (v / max) * ih;
    const gw = (W - L - R) / cats.length;
    const bw = 22, gap = 4;
    let out = '';
    for (let v = 0; v <= max; v += 15) out += `<line class="vc-chart__grid" x1="${L}" x2="${W - R}" y1="${n1(y(v))}" y2="${n1(y(v))}"/><text class="vc-chart__axis" x="${L - 8}" y="${n1(y(v) + 4)}" text-anchor="end">${v}</text>`;
    cats.forEach((c, i) => {
      const gx = L + gw * i + (gw - (bw * 3 + gap * 2)) / 2;
      series.forEach((s, j) => {
        const v = s.values[i];
        out += `<rect x="${n1(gx + j * (bw + gap))}" y="${n1(y(v))}" width="${bw}" height="${n1(y(0) - y(v))}" rx="2" style="fill:var(--vc-data-${j + 1})"><title>${s.name} ${c}: ${v}</title></rect>`;
      });
      out += `<text class="vc-chart__axis" x="${n1(L + gw * i + gw / 2)}" y="${H - 8}" text-anchor="middle">${c}</text>`;
    });
    return `<figure class="vc-chart"><figcaption><p class="vc-chart__title">Revenue by business line</p><p class="vc-chart__subtitle">€ million per quarter</p></figcaption><div class="vc-chart__plot"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Grouped bar chart: revenue per quarter for hardware, services and software. All three grow; hardware leads with 58 million in Q4.">${out}</svg></div><ul class="vc-legend">${series.map((s) => `<li>${s.name}</li>`).join('')}</ul><p class="vc-chart__source">Sample data</p></figure>`;
  },

  lines(arg) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const series = [
      { name: 'Agent', values: [12, 18, 21, 30, 34, 41, 47, 52, 58, 66, 71, 79] },
      { name: 'Assistant', values: [20, 22, 25, 27, 30, 31, 33, 36, 38, 39, 41, 44] },
      { name: 'Manual', values: [64, 60, 58, 55, 50, 47, 44, 40, 37, 33, 30, 26] },
    ];
    const W = Number(arg) || 600, H = 260, L = 40, B = 30, T = 14, R = 92;
    const max = 80;
    const ih = H - T - B;
    const x = (i) => L + (i * (W - L - R)) / (months.length - 1);
    const y = (v) => T + ih - (v / max) * ih;
    let out = '';
    for (let v = 0; v <= max; v += 20) out += `<line class="vc-chart__grid" x1="${L}" x2="${W - R}" y1="${n1(y(v))}" y2="${n1(y(v))}"/><text class="vc-chart__axis" x="${L - 8}" y="${n1(y(v) + 4)}" text-anchor="end">${v}</text>`;
    months.forEach((m, i) => { if (i % 2 === 0) out += `<text class="vc-chart__axis" x="${n1(x(i))}" y="${H - 8}" text-anchor="middle">${m}</text>`; });
    series.forEach((s, j) => {
      const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${n1(x(i))} ${n1(y(v))}`).join(' ');
      out += `<path d="${d}" fill="none" style="stroke:var(--vc-data-${j + 1})" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>`;
      s.values.forEach((v, i) => { out += `<polygon points="${hexPts(x(i), y(v), i === s.values.length - 1 ? 5 : 3.2)}" style="fill:var(--vc-data-${j + 1});stroke:var(--vc-surface)" stroke-width="1.5"/>`; });
      const last = s.values.at(-1);
      out += `<text class="vc-chart__axis" x="${n1(x(months.length - 1) + 12)}" y="${n1(y(last) + 4)}" style="fill:var(--vc-text);font-weight:600">${s.name} ${last}%</text>`;
    });
    return `<figure class="vc-chart"><figcaption><p class="vc-chart__title">Share of tickets resolved, by channel</p><p class="vc-chart__subtitle">Percent of monthly volume — labelled directly at the line ends</p></figcaption><div class="vc-chart__plot"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Line chart over twelve months: tickets resolved by the agent rise from 12 to 79 percent, the assistant from 20 to 44 percent, manual handling falls from 64 to 26 percent.">${out}</svg></div><p class="vc-chart__source">Sample data · hexagon markers, the last point enlarged</p></figure>`;
  },

  waffle() {
    const parts = [
      { name: 'Automated', pct: 64, token: 'data-1' },
      { name: 'Assisted', pct: 22, token: 'data-2' },
      { name: 'Manual', pct: 14, token: 'data-7' },
    ];
    const cols = 10, rows = 5; // 50 cells × 2 %
    const r = 13; // flat-top circumradius
    const w = 2 * r, h = Math.sqrt(3) * r;
    const fill = [];
    parts.forEach((p) => { for (let k = 0; k < p.pct / 2; k++) fill.push(p.token); });
    let out = '';
    let k = 0;
    for (let c = 0; c < cols; c++) {
      for (let rr = 0; rr < rows; rr++) {
        const cx = r + 2 + c * (0.75 * w + 2);
        const cy = h / 2 + 2 + rr * (h + 2) + (c % 2 ? (h + 2) / 2 : 0);
        out += `<polygon points="${hexPts(cx, cy, r)}" style="fill:var(--vc-${fill[k++]})"/>`;
      }
    }
    const W = n1(r + 2 + (cols - 1) * (0.75 * w + 2) + r + 2);
    const H = n1(h / 2 + 2 + (rows - 1) * (h + 2) + (h + 2) / 2 + h / 2 + 2);
    return `<figure class="vc-chart"><figcaption><p class="vc-chart__title">How invoices are processed</p><p class="vc-chart__subtitle">Each cell is 2 % of 12,400 invoices</p></figcaption><svg viewBox="0 0 ${W} ${H}" style="max-width:24rem" role="img" aria-label="Hexagon waffle chart: 64 percent automated, 22 percent assisted, 14 percent manual.">${out}</svg><ul class="vc-legend">${parts.map((p) => `<li style="--vc-series:var(--vc-${p.token})">${p.name} · ${p.pct} %</li>`).join('')}</ul></figure>`;
  },

  hexbin() {
    const cols = 16, rows = 7;
    const r = 11;
    const w = 2 * r, h = Math.sqrt(3) * r;
    let out = '';
    for (let c = 0; c < cols; c++) {
      for (let rr = 0; rr < rows; rr++) {
        const cx = r + 1 + c * (0.75 * w + 1);
        const cy = h / 2 + 1 + rr * (h + 1) + (c % 2 ? (h + 1) / 2 : 0);
        const dx = (c - 10.5) / 4.5, dy = (rr - 2.6) / 2.4;
        const dx2 = (c - 4) / 3, dy2 = (rr - 4.6) / 2;
        const v = Math.exp(-(dx * dx + dy * dy)) + 0.65 * Math.exp(-(dx2 * dx2 + dy2 * dy2));
        const bin = Math.max(1, Math.min(7, 1 + Math.round(v * 6.4)));
        out += `<polygon points="${hexPts(cx, cy, r - 0.5)}" style="fill:var(--vc-seq-${bin})"/>`;
      }
    }
    const W = n1(r + 1 + (cols - 1) * (0.75 * w + 1) + r + 1);
    const H = n1(h / 2 + 1 + (rows - 1) * (h + 1) + (h + 1) / 2 + h / 2 + 1);
    const ramp = [1, 2, 3, 4, 5, 6, 7].map((i) => `<span class="doc-data-cell" style="--sw:var(--vc-seq-${i});flex:0 0 1.6rem"></span>`).join('');
    return `<figure class="vc-chart"><figcaption><p class="vc-chart__title">Density as a hexbin map</p><p class="vc-chart__subtitle">Sequential merlot ramp, light to dark = low to high</p></figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Hexagonal binning chart showing two clusters of high density on a sequential merlot scale.">${out}</svg><div class="vc-cluster vc-cluster--sm" style="gap:2px"><span class="vc-caption" style="margin-right:6px">low</span>${ramp}<span class="vc-caption" style="margin-left:6px">high</span></div></figure>`;
  },

  diverging(arg) {
    const rows = [
      { name: 'North', v: 14 }, { name: 'East', v: 8 }, { name: 'Central', v: 3 },
      { name: 'South', v: -4 }, { name: 'West', v: -9 }, { name: 'Islands', v: -15 },
    ];
    const W = Number(arg) || 600, rowH = 30, T = 8, L = 90, R = 60;
    const H = T + rows.length * rowH + 22;
    const max = 20;
    const zero = L + (W - L - R) / 2;
    const sx = (v) => ((W - L - R) / 2) * (v / max);
    let out = `<line x1="${zero}" x2="${zero}" y1="${T - 4}" y2="${T + rows.length * rowH}" style="stroke:var(--vc-chart-axis)" stroke-width="1"/>`;
    rows.forEach((r, i) => {
      const yy = T + i * rowH + 6;
      const x0 = r.v >= 0 ? zero : zero + sx(r.v);
      out += `<text class="vc-chart__axis" x="${L - 10}" y="${yy + 13}" text-anchor="end" style="fill:var(--vc-text)">${r.name}</text>`;
      out += `<rect x="${n1(x0)}" y="${yy}" width="${n1(Math.abs(sx(r.v)))}" height="18" rx="2" style="fill:var(--vc-div-${r.v >= 0 ? 7 : 1})"/>`;
      out += `<text class="vc-chart__axis" x="${n1(r.v >= 0 ? zero + sx(r.v) + 6 : zero + sx(r.v) - 6)}" y="${yy + 13}" text-anchor="${r.v >= 0 ? 'start' : 'end'}">${r.v > 0 ? '+' : r.v < 0 ? '−' : ''}${Math.abs(r.v)} %</text>`;
    });
    out += `<text class="vc-chart__axis" x="${zero}" y="${H - 4}" text-anchor="middle">plan</text>`;
    return `<figure class="vc-chart"><figcaption><p class="vc-chart__title">Variance against plan, by region</p><p class="vc-chart__subtitle">Diverging: fjord above plan, coral below</p></figcaption><div class="vc-chart__plot"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Diverging bar chart: North +14, East +8, Central +3, South −4, West −9, Islands −15 percent against plan.">${out}</svg></div></figure>`;
  },

  sparkline(arg) {
    const sets = {
      up: [8, 9, 8.5, 10, 11, 10.6, 12, 13.1, 12.8, 14, 15.2, 16],
      down: [16, 15.5, 15.8, 14, 13.5, 13.9, 12.2, 11.8, 11, 10.2, 10.5, 9.4],
      flat: [10, 11, 10.4, 10.9, 10.2, 11.1, 10.6, 10.8, 10.1, 10.9, 10.5, 10.7],
      wave: [6, 9, 12, 10, 7, 9, 13, 15, 12, 10, 13, 16],
    };
    const [setName = 'up', series = '1'] = arg.split(/\s+/);
    const vals = sets[setName] || sets.up;
    const W = 200, H = 44, pad = 4;
    const min = Math.min(...vals), max = Math.max(...vals);
    const x = (i) => pad + (i * (W - 2 * pad)) / (vals.length - 1);
    const y = (v) => pad + (H - 2 * pad) * (1 - (v - min) / (max - min || 1));
    const line = vals.map((v, i) => `${i ? 'L' : 'M'}${n1(x(i))} ${n1(y(v))}`).join(' ');
    const area = `${line} L${n1(x(vals.length - 1))} ${H} L${n1(x(0))} ${H} Z`;
    const lx = x(vals.length - 1), ly = y(vals.at(-1));
    return `<svg class="vc-sparkline" viewBox="0 0 ${W} ${H}" aria-hidden="true" style="--vc-series:var(--vc-data-${series})"><path class="vc-sparkline__area" d="${area}"/><path class="vc-sparkline__line" d="${line}"/><polygon class="vc-sparkline__marker" points="${hexPts(lx, ly, 3.6)}"/></svg>`;
  },
};

// ---------------------------------------------------------------- widgets
function makeWidgets(ctx) {
  const { flat, icons, pages } = ctx;
  const v = (p) => resolve(flat, flat[p].value);
  const has = (p) => Boolean(flat[p]);
  const families = [...new Set(Object.keys(flat).filter((p) => p.startsWith('color.')).map((p) => p.split('.')[1]))];
  const stepsOf = (fam) => Object.keys(flat).filter((p) => p.startsWith(`color.${fam}.`)).map((p) => p.split('.')[2]);
  const famDesc = (fam) => {
    let node = ctx.tokens.color[fam];
    return node && node.$description ? node.$description : '';
  };
  const theme = (name) => Object.fromEntries(Object.keys(flat).filter((p) => p.startsWith(`theme.${name}.`)).map((p) => [p.split('.')[2], v(p)]));
  const L = theme('light');
  const D = theme('dark');

  const swatch = (fam, step) => {
    const hex = v(`color.${fam}.${step}`);
    const [l, c, h] = hexToOklch(hex);
    return `<button type="button" class="doc-swatch" style="--sw:${hex};color:${readable(hex)}" data-vc-copy="${hex}" data-vc-label="Copy ${hex}" aria-label="Copy ${fam} ${step}: ${hex}" title="oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})"><span class="doc-swatch__step">${step}</span><span class="doc-swatch__hex">${hex}</span></button>`;
  };

  const ratioBadge = (r) => {
    const level = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large / UI' : 'fail';
    const tone = r >= 4.5 ? 'success' : r >= 3 ? 'warning' : 'danger';
    return `<span class="vc-tag vc-tag--sm vc-tag--${tone}">${level}</span>`;
  };

  return {
    version: () => ctx.version,

    'css-size': () => `about ${Math.round(ctx.stats.gzCss / 1024)} KB (minified and gzipped)`,

    palette: () =>
      families
        .map((fam) => {
          const steps = stepsOf(fam);
          // numbered steps form the ramp; named steps (the night tints) get a row of their own
          const numbered = steps.filter((st) => /^\d+$/.test(st));
          const named = steps.filter((st) => !/^\d+$/.test(st));
          const ramp = (list) => `<div class="doc-family__ramp" style="--n:${list.length}">${list.map((st) => swatch(fam, st)).join('')}</div>`;
          return `<section class="doc-family" aria-labelledby="family-${fam}">
  <div class="doc-family__head"><h3 id="family-${fam}" class="doc-family__name">${fam[0].toUpperCase() + fam.slice(1)}</h3><p class="doc-family__role">${esc(famDesc(fam))}</p></div>
  ${ramp(numbered)}${named.length ? `\n  <p class="doc-family__sub">Tints for the accent and the status tones</p>\n  ${ramp(named)}` : ''}
</section>`;
        })
        .join('\n'),

    'semantic-colors': () => {
      const groups = [
        ['Surfaces', ['bg', 'bg-subtle', 'bg-sunken', 'surface', 'surface-raised', 'surface-hover', 'surface-pressed', 'surface-selected', 'surface-inverse', 'scrim']],
        ['Text', ['text', 'text-muted', 'text-subtle', 'text-disabled', 'text-inverse', 'text-link', 'text-link-hover']],
        ['Borders & focus', ['border-subtle', 'border', 'border-strong', 'focus']],
        ['Accent', ['accent', 'accent-hover', 'accent-pressed', 'on-accent', 'accent-soft', 'accent-soft-hover', 'on-accent-soft', 'accent-text']],
        ['Component helpers', ['rating', 'knob', 'track', 'chart-grid', 'chart-axis', 'shadow-color']],
      ];
      const cell = (hex) => `<span class="doc-chip-swatch" style="--sw:${hex}"></span><code>${hex}</code>`;
      return groups
        .map(([title, keys]) => `<h3 id="semantic-${slugify(title)}">${title}</h3>
<div class="vc-table-wrap"><table class="vc-table vc-table--compact doc-token-table">
<thead><tr><th scope="col">Token</th><th scope="col">Use</th><th scope="col">Light</th><th scope="col">Dark</th></tr></thead>
<tbody>${keys
          .filter((k) => L[k])
          .map((k) => `<tr><th scope="row"><code>--vc-${k}</code></th><td>${esc(SEMANTIC_NOTES[k] || '')}</td><td>${cell(L[k])}</td><td>${cell(D[k])}</td></tr>`)
          .join('')}</tbody></table></div>`)
        .join('\n');
    },

    'status-colors': () => {
      const tones = [
        ['info', 'Information, neutral system notices', 'Fjord'],
        ['success', 'Success, positive results, completion', 'Sage'],
        ['warning', 'Warnings, pending states, needs attention', 'Honey'],
        ['danger', 'Errors, destructive actions, negative trends', 'Coral'],
        ['feature', 'AI-generated, experimental or new', 'Lilac'],
        ['neutral', 'Default, inactive, archived', 'Linen'],
      ];
      return `<div class="vc-table-wrap"><table class="vc-table doc-token-table">
<thead><tr><th scope="col">Tone</th><th scope="col">Family</th><th scope="col">Meaning</th><th scope="col">Light</th><th scope="col">Dark</th></tr></thead>
<tbody>${tones
        .map(([t, meaning, fam]) => {
          const sample = (T) => `<span class="doc-tone-sample" style="background:${T[`${t}-bg`]};color:${T[`${t}-text`]};border-color:${T[`${t}-border`]}">Text ${contrast(T[`${t}-text`], T[`${t}-bg`]).toFixed(1)}:1</span><span class="doc-tone-solid" style="background:${T[`${t}-solid`]};color:${T[`${t}-on-solid`]}">Solid</span>`;
          return `<tr><th scope="row"><code>${t}</code></th><td>${fam}</td><td class="doc-wrap">${meaning}</td><td>${sample(L)}</td><td>${sample(D)}</td></tr>`;
        })
        .join('')}</tbody></table></div>`;
    },

    'contrast-table': () => {
      // [foreground, background, kind] — kind 'ui' means a non-text boundary (needs 3:1)
      const pairs = [
        ['text', 'bg'], ['text', 'surface'], ['text-muted', 'bg'], ['text-muted', 'bg-subtle'], ['text-subtle', 'surface'],
        ['text-link', 'bg'], ['on-accent', 'accent'], ['on-accent-soft', 'accent-soft'], ['accent-text', 'surface'],
        ['info-text', 'info-bg'], ['success-text', 'success-bg'], ['warning-text', 'warning-bg'], ['danger-text', 'danger-bg'], ['feature-text', 'feature-bg'],
        ['border-strong', 'surface', 'ui'], ['focus', 'bg', 'ui'],
      ];
      const badge = (r, kind) => {
        if (kind === 'ui') return `<span class="vc-tag vc-tag--sm vc-tag--${r >= 3 ? 'success' : 'danger'}">${r >= 3 ? 'UI ≥ 3:1' : 'fail'}</span>`;
        return ratioBadge(r);
      };
      const sample = (T, fg, bg, kind) => kind === 'ui'
        ? `<span class="doc-contrast-sample" style="background:${T[bg]};box-shadow:inset 0 0 0 2px ${T[fg]}" aria-hidden="true"></span>`
        : `<span class="doc-contrast-sample" style="color:${T[fg]};background:${T[bg]}">Aa</span>`;
      return `<div class="vc-table-wrap"><table class="vc-table doc-token-table">
<thead><tr><th scope="col">Foreground on background</th><th scope="col">Light</th><th scope="col">Dark</th></tr></thead>
<tbody>${pairs
        .map(([fg, bg, kind]) => {
          const rl = contrast(L[fg], L[bg]);
          const rd = contrast(D[fg], D[bg]);
          return `<tr><th scope="row"><code>${fg}</code> on <code>${bg}</code></th><td>${sample(L, fg, bg, kind)} <span class="vc-tabular">${rl.toFixed(2)}:1</span> ${badge(rl, kind)}</td><td>${sample(D, fg, bg, kind)} <span class="vc-tabular">${rd.toFixed(2)}:1</span> ${badge(rd, kind)}</td></tr>`;
        })
        .join('')}</tbody></table></div>`;
    },

    'data-palette': () => {
      const strip = (T, keys, label) =>
        `<div class="doc-data-strip" role="img" aria-label="${esc(label)}">${keys.map((k) => `<span class="doc-data-cell" style="--sw:${T[k]};color:${readable(T[k])}" title="${k}: ${T[k]}"><span>${k.replace('data-', '').replace('seq-', '').replace('div-', '')}</span></span>`).join('')}</div>`;
      const cat = ['data-1', 'data-2', 'data-3', 'data-4', 'data-5', 'data-6', 'data-7', 'data-8'];
      const seq = ['seq-1', 'seq-2', 'seq-3', 'seq-4', 'seq-5', 'seq-6', 'seq-7'];
      const div = ['div-1', 'div-2', 'div-3', 'div-4', 'div-5', 'div-6', 'div-7'];
      const minDist = (T, mode) => {
        const cols = cat.slice(0, 6).map((k) => (mode === 'normal' ? T[k] : simulate(T[k], mode)));
        let m = Infinity;
        for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) m = Math.min(m, deltaOk(cols[i], cols[j]));
        return m.toFixed(3);
      };
      const distRow = (T) => ['normal', 'protan', 'deutan', 'tritan'].map((m) => `<td class="vc-num">${minDist(T, m)}</td>`).join('');
      return `<div class="doc-data-grid">
  <div><h3 class="doc-data-grid__title">Categorical — light</h3>${strip(L, cat, 'Categorical series colours, light theme')}</div>
  <div class="doc-dark-panel" data-theme="dark"><h3 class="doc-data-grid__title">Categorical — dark</h3>${strip(D, cat, 'Categorical series colours, dark theme')}</div>
  <div><h3 class="doc-data-grid__title">Sequential — light</h3>${strip(L, seq, 'Sequential ramp, light theme')}</div>
  <div class="doc-dark-panel" data-theme="dark"><h3 class="doc-data-grid__title">Sequential — dark</h3>${strip(D, seq, 'Sequential ramp, dark theme')}</div>
  <div><h3 class="doc-data-grid__title">Diverging — light</h3>${strip(L, div, 'Diverging ramp, light theme')}</div>
  <div class="doc-dark-panel" data-theme="dark"><h3 class="doc-data-grid__title">Diverging — dark</h3>${strip(D, div, 'Diverging ramp, dark theme')}</div>
</div>
<div class="vc-table-wrap"><table class="vc-table vc-table--compact">
<caption>Smallest perceptual distance (ΔOKLab) between any two of the six categorical series, measured by the build, also under simulated colour-vision deficiencies.</caption>
<thead><tr><th scope="col">Theme</th><th scope="col" class="vc-num">Normal</th><th scope="col" class="vc-num">Protanopia</th><th scope="col" class="vc-num">Deuteranopia</th><th scope="col" class="vc-num">Tritanopia</th></tr></thead>
<tbody><tr><th scope="row">Light</th>${distRow(L)}</tr><tr><th scope="row">Dark</th>${distRow(D)}</tr></tbody></table></div>`;
    },

    'type-scale': () => {
      const sizes = Object.keys(flat).filter((p) => p.startsWith('font.size.'));
      const display = new Set(['3xl', '4xl', '5xl', '6xl', '7xl']);
      return `<div class="doc-type-scale">${sizes
        .map((p) => {
          const key = p.split('.')[2];
          const value = v(p);
          const font = display.has(key) ? 'display' : 'text';
          return `<div class="doc-type-row"><div class="doc-type-meta"><code>--vc-font-size-${key}</code><span>${esc(flat[p].description || '')}</span></div><div class="doc-type-sample" style="font-size:var(--vc-font-size-${key});font-family:var(--vc-font-${font});${font === 'display' ? 'font-weight:var(--vc-weight-display);letter-spacing:var(--vc-tracking-display);line-height:1.1' : ''}">${font === 'display' ? (['6xl', '7xl'].includes(key) ? 'Honeycomb' : 'Hexagons tessellate') : 'Data and design, side by side'}</div></div>`;
        })
        .join('')}</div>`;
    },

    'spacing-scale': () => {
      // ordered by size, so the 2 px hairline sits between 0 and 4 px
      const keys = Object.keys(flat).filter((p) => p.startsWith('space.')).sort((a, b) => parseFloat(v(a)) - parseFloat(v(b)));
      return `<div class="doc-scale">${keys
        .map((p) => {
          const k = p.split('.')[1];
          return `<div class="doc-scale__row"><code>--vc-space-${k}</code><span class="vc-tabular">${v(p)}</span><span class="doc-scale__bar" style="width:${v(p)}"></span></div>`;
        })
        .join('')}</div>`;
    },

    'radius-scale': () =>
      `<div class="doc-radius-grid">${Object.keys(flat)
        .filter((p) => p.startsWith('radius.'))
        .map((p) => `<div class="doc-radius"><span style="border-radius:${v(p)}"></span><code>--vc-radius-${p.split('.')[1]}</code><small>${v(p)}</small></div>`)
        .join('')}</div>`,

    'cell-scale': () =>
      `<div class="doc-cell-scale">${Object.keys(flat)
        .filter((p) => p.startsWith('cell.'))
        .map((p) => `<div class="doc-cell-item"><span class="vc-hex" style="height:${v(p)};background:var(--vc-merlot-300)"></span><code>--vc-cell-${p.split('.')[1]}</code><small>${v(p)} high</small></div>`)
        .join('')}</div>`,

    'shadow-scale': () =>
      `<div class="doc-shadow-grid">${Object.keys(flat)
        .filter((p) => p.startsWith('shadow.'))
        .map((p) => `<div class="doc-shadow" style="box-shadow:var(--vc-shadow-${p.split('.')[1]})"><code>--vc-shadow-${p.split('.')[1]}</code></div>`)
        .join('')}</div>`,

    'motion-table': () => {
      const durs = Object.keys(flat).filter((p) => p.startsWith('duration.'));
      const eases = Object.keys(flat).filter((p) => p.startsWith('easing.'));
      return `<div class="vc-table-wrap"><table class="vc-table">
<thead><tr><th scope="col">Duration</th><th scope="col" class="vc-num">Value</th><th scope="col">Typical use</th></tr></thead>
<tbody>${durs
        .map((p) => {
          const k = p.split('.')[1];
          const use = { instant: 'Hover colour, press feedback', quick: 'Small state changes, tooltips', base: 'Toggles, menus, accordions', slow: 'Dialogs, drawers, toasts', deliberate: 'Large surfaces, page-level transitions' }[k] || '';
          return `<tr><th scope="row"><code>--vc-duration-${k}</code></th><td class="vc-num">${v(p)}</td><td>${use}</td></tr>`;
        })
        .join('')}</tbody></table></div>
<div class="doc-ease-grid">${eases
        .map((p) => {
          const k = p.split('.')[1];
          return `<div class="doc-ease"><div class="doc-ease__track"><span class="doc-ease__dot vc-hex" style="transition-timing-function:var(--vc-ease-${k})"></span></div><code>--vc-ease-${k}</code><small>cubic-bezier(${v(p).join(', ')})</small><small>${esc(flat[p].description || '')}</small></div>`;
        })
        .join('')}</div>`;
    },

    'z-scale': () =>
      `<div class="vc-table-wrap"><table class="vc-table vc-table--compact"><thead><tr><th scope="col">Layer</th><th scope="col" class="vc-num">z-index</th></tr></thead><tbody>${Object.keys(flat)
        .filter((p) => p.startsWith('z.'))
        .map((p) => `<tr><th scope="row"><code>--vc-z-${p.split('.')[1]}</code></th><td class="vc-num">${v(p)}</td></tr>`)
        .join('')}</tbody></table></div>`,

    'icon-gallery': () =>
      `<div class="doc-icon-grid">${icons
        .map(({ name }) => `<button type="button" class="doc-icon" data-vc-copy="vc-icon vc-icon--${name}" data-vc-label="Copy class for ${name}" aria-label="Copy class for ${name}"><span class="vc-icon vc-icon--${name}" aria-hidden="true"></span><span>${name}</span></button>`)
        .join('')}</div>`,

    'icon-count': () => String(icons.length),

    // <!-- @platform-mark github --> → another brand's logo from assets/marks/, unchanged.
    // An SVG is inlined (only its fixed size goes, so CSS can size it and --vc-platform-mark
    // can colour it); a PNG becomes an <img> with its own pixel size for the aspect ratio.
    // The link around it carries the name, so the logo itself is hidden from screen readers.
    'platform-mark': (name) => {
      const base = join(ctx.root, 'assets/marks', name.trim());
      if (existsSync(`${base}.svg`)) {
        const svg = readFileSync(`${base}.svg`, 'utf8').trim();
        return svg.replace(/^<svg\b([^>]*)>/, (all, attrs) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} class="vc-platform-mark" aria-hidden="true" focusable="false">`);
      }
      const png = readFileSync(`${base}.png`);
      const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)]; // IHDR
      return `<img class="vc-platform-mark" src="{{root}}assets/marks/${name.trim()}.png" alt="" width="${w}" height="${h}">`;
    },

    // <!-- @licence-text --> → the repository's LICENSE file, word for word, reflowed for phones
    'licence-text': () => `<div class="doc-licence">\n${licenceHtml(readFileSync(join(ctx.root, 'LICENSE'), 'utf8'))}\n</div>`,

    // <!-- @vertex-mark --> → the Vertex symbol inline, coloured by the theme (text colour and
    // merlot-500 goal), so it stays visible on dark headers where the colour file would vanish
    'vertex-mark': () => logoMarkSvg({ size: 26, title: false }),

    // <!-- @portrait 96 --> → Victor's portrait inside a byline avatar (empty alt: his name is next to it)
    portrait: (size) => {
      const file = size.trim() ? `portrait-${size.trim()}.jpg` : 'portrait.jpg';
      const px = size.trim() ? Number(size.trim()) : 640;
      return `<img src="{{root}}assets/brand/${file}" alt="" width="${px}" height="${px}">`;
    },

    chart: (name) => {
      const [kind, ...rest] = name.split(/\s+/);
      if (!CHARTS[kind]) throw new Error(`@chart: unknown chart ${kind}`);
      return CHARTS[kind](rest.join(' '));
    },

    // <!-- @token container.prose --> → the resolved value of any token
    token: (path) => {
      if (!has(path)) throw new Error(`@token: unknown token ${path}`);
      const r = v(path);
      return Array.isArray(r) ? r.join(', ') : String(r);
    },

    // <!-- @ratio text bg light --> → measured contrast ratio, e.g. "17.9:1"
    ratio: (args) => {
      const [fg, bg, th = 'light'] = args.split(/\s+/);
      const T = th === 'dark' ? D : L;
      if (!T[fg] || !T[bg]) throw new Error(`@ratio: unknown tokens ${args}`);
      return `${contrast(T[fg], T[bg]).toFixed(1)}:1`;
    },

    'token-reference': () => {
      const groups = {};
      for (const [p, tok] of Object.entries(flat)) {
        const g = p.startsWith('theme.') ? `Theme · ${p.split('.')[1]}` : p.split('.')[0];
        (groups[g] ||= []).push([p, tok]);
      }
      const name = (p) => {
        const s = p.split('.');
        if (s[0] === 'color') return `--vc-${s[1]}-${s[2]}`;
        if (s[0] === 'theme') return `--vc-${s[2]}`;
        if (s[0] === 'font') return { family: `--vc-font-${s[2]}`, weight: `--vc-weight-${s[2]}`, size: `--vc-font-size-${s[2]}`, leading: `--vc-leading-${s[2]}`, tracking: `--vc-tracking-${s[2]}` }[s[1]];
        if (s[0] === 'easing') return `--vc-ease-${s[1]}`;
        return `--vc-${s.join('-')}`;
      };
      const show = (p, tok) => {
        const r = resolve(flat, tok.value);
        if (Array.isArray(r) && typeof r[0] === 'object') return 'layered shadow (see Elevation)';
        if (Array.isArray(r)) return tok.type === 'cubicBezier' ? `cubic-bezier(${r.join(', ')})` : r.join(', ');
        return String(r);
      };
      return Object.entries(groups)
        .map(([g, rows]) => `<h3 id="ref-${slugify(g)}">${esc(g[0].toUpperCase() + g.slice(1))}</h3>
<div class="vc-table-wrap"><table class="vc-table vc-table--compact doc-token-table"><thead><tr><th scope="col">CSS variable</th><th scope="col">Value</th><th scope="col">Source</th></tr></thead><tbody>${rows
          .map(([p, tok]) => {
            const r = show(p, tok);
            const sw = /^#[0-9a-f]{6}$/i.test(r) ? `<span class="doc-chip-swatch" style="--sw:${r}"></span>` : '';
            const ref = typeof tok.value === 'string' && tok.value.startsWith('{') ? `<code>${esc(tok.value)}</code>` : '';
            return `<tr><th scope="row"><code>${name(p)}</code></th><td>${sw}<code>${esc(r)}</code></td><td>${ref}</td></tr>`;
          })
          .join('')}</tbody></table></div>`)
        .join('\n');
    },

    'nav-cards': (section) => {
      const list = pages.filter((p) => p.meta.section === section).sort((a, b) => a.order - b.order);
      return `<div class="vc-grid doc-nav-cards" style="--vc-grid-min:15rem">${list
        .map((p) => `<article class="vc-card vc-card--interactive"><div class="vc-card__body"><span class="vc-cell vc-cell--lg" aria-hidden="true"><span class="vc-icon vc-icon--${p.meta.icon || 'hexagon'}"></span></span><h3 class="vc-card__title"><a class="vc-card__link" href="{{root}}${p.path}">${esc(p.meta.title)}</a></h3><p class="vc-card__meta">${esc(p.meta.description || '')}</p></div></article>`)
        .join('')}</div>`;
    },
  };
}

// ------------------------------------------------------------------ demos
function renderDemos(body, counter) {
  return body.replace(/<!--\s*demo([^>]*?)-->([\s\S]*?)<!--\s*\/demo\s*-->/g, (all, opts, html) => {
    const options = opts.trim().split(/\s+/).filter(Boolean);
    const id = `demo-code-${++counter.n}`;
    const classes = ['doc-demo', ...options.filter((o) => !['nocode', 'dark', 'split'].includes(o)).map((o) => `doc-demo--${o}`)];
    const code = dedent(html);
    const preview = options.includes('split')
      ? `<div class="doc-demo__split"><div class="doc-demo__preview" data-theme="light">${html}</div><div class="doc-demo__preview" data-theme="dark">${html.replace(/\sid="([^"]+)"/g, ' id="$1-dark"').replace(/\sfor="([^"]+)"/g, ' for="$1-dark"').replace(/\saria-(controls|labelledby|describedby)="([^"]+)"/g, ' aria-$1="$2-dark"').replace(/\sname="([^"]+)"/g, ' name="$1-dark"')}</div></div>`
      : `<div class="doc-demo__preview"${options.includes('dark') ? ' data-theme="dark"' : ''}>${html}</div>`;
    const codeBlock = options.includes('nocode')
      ? ''
      : `<div class="doc-demo__code"><details><summary>HTML</summary><pre><code id="${id}">${highlight(code)}</code></pre></details><button type="button" class="vc-button vc-button--ghost vc-button--sm doc-demo__copy" data-vc-copy="#${id}" data-vc-label="Copy code" aria-label="Copy code"><span class="vc-icon vc-icon--copy" aria-hidden="true"></span>Copy</button></div>`;
    return `<div class="${classes.join(' ')}">${preview}${codeBlock}</div>`;
  });
}

// ------------------------------------------------------------------- render
export function renderDocs({ root, version, tokens, flat, icons, stats }) {
  const SRC = join(root, 'src/docs');
  const layout = readFileSync(join(SRC, 'layout.html'), 'utf8');
  const files = walk(join(SRC, 'pages'));
  const pages = files.map((path) => {
    const src = readFileSync(join(SRC, 'pages', path), 'utf8');
    const { meta, body } = frontMatter(src);
    if (!meta.title) throw new Error(`docs page ${path} has no title`);
    return { path, meta, body, order: Number(meta.order || 0), depth: path.split('/').length - 1 };
  });

  const ordered = SECTIONS.flatMap((s) => pages.filter((p) => p.meta.section === s).sort((a, b) => a.order - b.order));
  const home = pages.find((p) => p.path === 'index.html');
  const sequence = home ? [home, ...ordered] : ordered;

  const ctx = { root, tokens, flat, icons, pages, version, stats: stats || { minCss: 0, gzCss: 0 } };
  const widgets = makeWidgets(ctx);
  const counter = { n: 0 };
  const out = [];

  for (const page of pages) {
    const rootRel = page.depth ? '../'.repeat(page.depth) : '';
    // 1. park demo blocks so their headings stay out of the outline
    const demos = [];
    let body = page.body.replace(/<!--\s*demo[^>]*?-->[\s\S]*?<!--\s*\/demo\s*-->/g, (block) => {
      demos.push(block);
      return `@@DEMO_${demos.length - 1}@@`;
    });
    // 2. widgets
    const expand = (text) =>
      text.replace(/<!--\s*@([a-z-]+)\s*([^>]*?)\s*-->/g, (all, name, arg) => {
        if (!widgets[name]) throw new Error(`Unknown widget @${name} in ${page.path}`);
        return widgets[name](arg);
      });
    body = expand(body);

    // 3. heading ids + table of contents (h2 only)
    const toc = [];
    const used = new Set();
    body = body.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (all, level, attrs, inner) => {
      let id = (attrs.match(/\sid="([^"]+)"/) || [])[1];
      if (!id) {
        id = slugify(inner) || `section-${used.size + 1}`;
        while (used.has(id)) id += '-x';
        attrs += ` id="${id}"`;
      }
      used.add(id);
      // the TOC shows the heading text without decorations such as a "Recommended" tag
      const label = inner.replace(/<span class="vc-tag[^"]*"[^>]*>[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '').trim();
      if (level === '2' && !/data-toc="false"/.test(attrs)) toc.push({ id, text: label });
      return `<h${level}${attrs}>${inner}</h${level}>`;
    });

    // 4. live demos with copyable code
    body = body.replace(/@@DEMO_(\d+)@@/g, (all, i) => renderDemos(expand(demos[Number(i)]), counter));
    body = body.replace(/\{\{root\}\}/g, rootRel);

    const isHome = page.path === 'index.html';
    const sidebar = [
      `<ul><li><a href="${rootRel}index.html"${isHome ? ' aria-current="page"' : ''}><span class="vc-icon vc-icon--home" aria-hidden="true"></span>Overview</a></li></ul>`,
      ...SECTIONS.map((s) => {
        const items = ordered.filter((p) => p.meta.section === s);
        if (!items.length) return '';
        return `<div><p class="vc-sidenav__title">${s}</p><ul>${items
          .map((p) => `<li><a href="${rootRel}${p.path}"${p === page ? ' aria-current="page"' : ''}><span class="vc-icon vc-icon--${p.meta.icon || 'hexagon'}" aria-hidden="true"></span>${esc(p.meta.nav || p.meta.title)}</a></li>`)
          .join('')}</ul></div>`;
      }),
    ].join('\n');

    const headernav = SECTIONS.map((s) => {
      const first = ordered.find((p) => p.meta.section === s);
      if (!first) return '';
      return `<a href="${rootRel}${first.path}"${page.meta.section === s ? ' aria-current="true"' : ''}>${s}</a>`;
    }).join('');

    const idx = sequence.indexOf(page);
    const prev = idx > 0 ? sequence[idx - 1] : null;
    const next = idx >= 0 && idx < sequence.length - 1 ? sequence[idx + 1] : null;
    const pager = isHome
      ? ''
      : `<nav class="doc-pager" aria-label="Previous and next page">${prev ? `<a class="doc-pager__link" href="${rootRel}${prev.path}" rel="prev"><span class="vc-caption">Previous</span><span>${esc(prev.meta.title)}</span></a>` : '<span></span>'}${next ? `<a class="doc-pager__link doc-pager__link--next" href="${rootRel}${next.path}" rel="next"><span class="vc-caption">Next</span><span>${esc(next.meta.title)}</span></a>` : '<span></span>'}</nav>`;

    const tocHtml = toc.length > 1 && !isHome
      ? `<nav class="doc-toc" aria-label="On this page"><p class="vc-sidenav__title">On this page</p><ul>${toc.map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`).join('')}</ul></nav>`
      : '';

    const html = layout
      .replace(/\{\{pageTitle\}\}/g, esc(isHome ? 'Vici Design System' : `${page.meta.title} · Vici Design System`))
      .replace(/\{\{description\}\}/g, esc(page.meta.description || 'Vici — a personal design system built on hexagons, merlot and pastels.'))
      .replace(/\{\{logo\}\}/g, logoMarkSvg({ size: 26, title: false }) + viciWordmarkSvg(root, { height: 21, title: 'Vici' }))
      .replace(/\{\{headernav\}\}/g, headernav)
      .replace(/\{\{sidebar\}\}/g, sidebar)
      .replace(/\{\{toc\}\}/g, tocHtml)
      .replace(/\{\{pager\}\}/g, pager)
      .replace(/\{\{bodyClass\}\}/g, isHome ? 'doc doc--home' : page.meta.layout === 'wide' ? 'doc doc--wide' : 'doc')
      .replace(/\{\{version\}\}/g, version)
      .replace(/\{\{linkedinMark\}\}/g, () => widgets['platform-mark']('linkedin'))
      .replace(/\{\{portrait\}\}/g, () => widgets.portrait('96'))
      .replace(/\{\{root\}\}/g, rootRel)
      .replace(/\{\{content\}\}/g, () => body);
    out.push([page.path, html]);
  }

  // Starters: complete standalone pages; only widgets, {{root}} and {{version}} are filled in.
  const STARTERS = join(root, 'src/starters');
  for (const file of readdirSync(STARTERS).filter((f) => f.endsWith('.html')).sort()) {
    const html = readFileSync(join(STARTERS, file), 'utf8')
      .replace(/<!--\s*@([a-z-]+)\s*([^>]*?)\s*-->/g, (all, name, arg) => {
        if (!widgets[name]) throw new Error(`Unknown widget @${name} in starter ${file}`);
        return widgets[name](arg);
      })
      .replace(/\{\{root\}\}/g, '../')
      .replace(/\{\{version\}\}/g, version);
    out.push([`starters/${file}`, html]);
  }

  out.push(['assets/docs/docs.css', readFileSync(join(SRC, 'docs.css'), 'utf8')]);
  out.push(['assets/docs/docs.js', readFileSync(join(SRC, 'docs.js'), 'utf8')]);
  return out;
}
