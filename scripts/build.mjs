#!/usr/bin/env node
// Vici build — zero dependencies, Node 18+.
//
//   node scripts/build.mjs          build everything (dist/, docs pages, exports)
//   node scripts/build.mjs --check  build in memory and fail if any generated file is stale
//
// Sources:  src/tokens/tokens.json · src/css/** · src/js/vici.js · src/icons/*.svg
//           src/docs/** (page partials + layout) · src/brand/** (logo geometry)
// Outputs:  dist/** · index.html + start/ guidelines/ components/ brand/ (docs site)
//           integrations/** (Streamlit, Power BI, Python, Tailwind) · assets/logo/**

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync, rmSync, rmdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { loadTokens, flatten, resolve } from './lib/tokens.mjs';
import { renderDocs } from './lib/docs.mjs';
import { buildLogos } from './lib/logos.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CHECK = process.argv.includes('--check');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const outputs = new Map();
const emit = (path, content) => outputs.set(path.split(sep).join('/'), content);
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

// ------------------------------------------------------------------ tokens
const tokens = loadTokens();
const flat = flatten(tokens);
const val = (path) => resolve(flat, flat[path].value);

function varName(path) {
  const p = path.split('.');
  switch (p[0]) {
    case 'color': return `--vc-${p[1]}-${p[2]}`;
    case 'font':
      if (p[1] === 'family') return `--vc-font-${p[2]}`;
      if (p[1] === 'weight') return `--vc-weight-${p[2]}`;
      if (p[1] === 'size') return `--vc-font-size-${p[2]}`;
      if (p[1] === 'leading') return `--vc-leading-${p[2]}`;
      if (p[1] === 'tracking') return `--vc-tracking-${p[2]}`;
      break;
    case 'easing': return `--vc-ease-${p[1]}`;
    case 'theme': return `--vc-${p[2]}`;
    default: return `--vc-${p.join('-')}`;
  }
  throw new Error(`No CSS name for token ${path}`);
}

function cssValue(tok, path) {
  const v = tok.value;
  if (typeof v === 'string' && v.startsWith('{')) return `var(${varName(v.slice(1, -1))})`;
  if (tok.type === 'fontFamily') return v.map((f) => (/\s/.test(f) ? `'${f}'` : f)).join(', ');
  if (tok.type === 'cubicBezier') return `cubic-bezier(${v.join(', ')})`;
  return String(v);
}

const hexToRgbTriplet = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');

function shadowCss(theme) {
  const color = hexToRgbTriplet(val(`theme.${theme}.shadow-color`));
  const boost = theme === 'dark' ? 2.6 : 1;
  const lines = [];
  for (const [path, tok] of Object.entries(flat)) {
    if (!path.startsWith('shadow.')) continue;
    const layers = tok.value.map((l) => `${l.offsetX} ${l.offsetY} ${l.blur} ${l.spread} rgb(${color} / ${Math.min(0.7, +(l.alpha * boost).toFixed(3))})`);
    lines.push(`  --vc-shadow-${path.split('.')[1]}: ${layers.join(', ')};`);
  }
  return lines;
}

const svgDataUri = (svg) =>
  `url("data:image/svg+xml,${svg.replace(/\s*\n\s*/g, ' ').replace(/"/g, "'").replace(/%/g, '%25').replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').trim()}")`;

function themeAssets(theme) {
  const muted = val(`theme.${theme}.text-muted`);
  const line = val(`theme.${theme}.border-subtle`);
  const chevron = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 10.25 L12 14 L18.5 10.25"/></svg>`;
  // Honeycomb lattice tile: flat-top hexagons, side 14px → tile 42 × 24.249px.
  const s = 14;
  const h = +(s * Math.sqrt(3)).toFixed(3);
  const w = 3 * s;
  const hx = (cx, cy) => [0, 60, 120, 180, 240, 300].map((a) => `${+(cx + s * Math.cos((a * Math.PI) / 180)).toFixed(2)},${+(cy + s * Math.sin((a * Math.PI) / 180)).toFixed(2)}`).join(' ');
  const pattern = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g fill="none" stroke="${line}" stroke-width="1"><polygon points="${hx(0, h / 2)}"/><polygon points="${hx(w, h / 2)}"/><polygon points="${hx(s * 1.5, 0)}"/><polygon points="${hx(s * 1.5, h)}"/></g></svg>`;
  // Other brands' logos as images (LinkedIn's [in] PNG) come in black; the dark theme shows
  // them white, the only other colour their owners allow (see .vc-platform-mark).
  const markFilter = theme === 'dark' ? 'brightness(0) invert(1)' : 'none';
  return [
    `  --vc-select-chevron: ${svgDataUri(chevron)};`,
    `  --vc-honeycomb-pattern: ${svgDataUri(pattern)};`,
    `  --vc-platform-mark-filter: ${markFilter};`,
    `  --vc-honeycomb-pattern-size: ${w}px ${h}px;`,
  ];
}

function themeBlock(theme) {
  const lines = [`  color-scheme: ${theme};`];
  for (const [path, tok] of Object.entries(flat)) {
    if (path.startsWith(`theme.${theme}.`)) lines.push(`  ${varName(path)}: ${cssValue(tok, path)};`);
  }
  return [...lines, ...shadowCss(theme), ...themeAssets(theme)];
}

function tokensCss() {
  const prim = [];
  for (const [path, tok] of Object.entries(flat)) {
    if (path.startsWith('theme.') || path.startsWith('shadow.')) continue;
    prim.push(`  ${varName(path)}: ${cssValue(tok, path)};`);
  }
  const light = themeBlock('light');
  const dark = themeBlock('dark');
  const indent = (arr) => arr.map((l) => '  ' + l).join('\n');
  return `/* Vici tokens v${VERSION} — generated from src/tokens/tokens.json. Do not edit by hand. */
@layer vici.tokens {
  :root {
${indent(prim)}
  }

  /* Light theme (default), also inside pastel .vc-tint-* sections, which stay light in both themes */
  :root,
  [data-theme='light'],
  [class*='vc-tint-'] {
${indent(light)}
  }

  /* Dark theme: follows the OS unless a light theme is forced… */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
${dark.map((l) => '    ' + l).join('\n')}
    }
  }

  /* …or when requested explicitly, on <html> or on any element. The brand footer is always dark. */
  [data-theme='dark'],
  .vc-footer--brand {
${indent(dark)}
  }

  /* Inverse surfaces take the opposite theme: dark on a light page, light on a dark one. */
  .vc-surface-inverse {
${indent(dark)}
  }
  @media (prefers-color-scheme: dark) {
    :where(:root:not([data-theme='light'])) .vc-surface-inverse {
${light.map((l) => '    ' + l).join('\n')}
    }
  }
  [data-theme='dark'] .vc-surface-inverse {
${indent(light)}
  }
  [data-theme='light'] .vc-surface-inverse {
${indent(dark)}
  }
}
`;
}

// ------------------------------------------------------------------- icons
const ICON_DIR = join(ROOT, 'src/icons');
const icons = readdirSync(ICON_DIR)
  .filter((f) => f.endsWith('.svg'))
  .sort()
  .map((f) => ({ name: f.slice(0, -4), svg: readFileSync(join(ICON_DIR, f), 'utf8').trim() }));

function iconsCss() {
  const vars = icons.map(({ name, svg }) => `    --vc-svg-${name}: ${svgDataUri(svg.replace(/currentColor/g, 'black'))};`);
  const classes = icons.map(({ name }) => `  .vc-icon--${name} { --_icon: var(--vc-svg-${name}); }`);
  return `/* Icons — ${icons.length} glyphs from src/icons, drawn on a 24px grid with 1.75px strokes.
   Usage: <span class="vc-icon vc-icon--search" aria-hidden="true"></span>  (colour = currentColor) */
@layer vici.components {
  :root {
${vars.join('\n')}
  }
  .vc-icon {
    display: inline-block;
    flex: none;
    width: var(--vc-icon-size, 1.25rem);
    height: var(--vc-icon-size, 1.25rem);
    background-color: currentColor;
    -webkit-mask: var(--_icon) center / contain no-repeat;
    mask: var(--_icon) center / contain no-repeat;
    vertical-align: -0.22em;
  }
  .vc-icon--xs { --vc-icon-size: 0.875rem; }
  .vc-icon--sm { --vc-icon-size: 1rem; }
  .vc-icon--lg { --vc-icon-size: 1.5rem; }
  .vc-icon--xl { --vc-icon-size: 2rem; }
${classes.join('\n')}
}
`;
}

function iconSprite() {
  const symbols = icons.map(({ name, svg }) => {
    const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').trim();
    return `  <symbol id="vc-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner.replace(/\s*\n\s*/g, '')}</symbol>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols.join('\n')}\n</svg>\n`;
}

// --------------------------------------------------------------------- css
const CSS_ORDER = [
  'src/css/base.css',
  'src/css/shape.css',
  'src/css/layout.css',
  'src/css/components/actions.css',
  'src/css/components/forms.css',
  'src/css/components/content.css',
  'src/css/components/navigation.css',
  'src/css/components/feedback.css',
  'src/css/components/overlays.css',
  'src/css/components/data.css',
];

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim() + '\n';
}

function bundleCss() {
  const banner = `/*!
 * Vici Design System v${VERSION} — https://github.com/VictorPflueger/ViciDesign
 * Hexagons instead of circles · merlot #250010 with pastel families · light and dark themes.
 * Fonts: Bricolage Grotesque, Inter, JetBrains Mono (SIL OFL 1.1, self-hosted in assets/fonts).
 */
@layer vici.tokens, vici.base, vici.layout, vici.components, vici.utilities;
`;
  const parts = [banner, read('src/css/fonts.css'), tokensCss(), ...CSS_ORDER.map(read), iconsCss(), read('src/css/utilities.css'), read('src/css/forced-colors.css')];
  return parts.join('\n');
}

// ------------------------------------------------------------- integrations
const theme = (name) => Object.fromEntries(Object.keys(flat).filter((p) => p.startsWith(`theme.${name}.`)).map((p) => [p.split('.')[2], val(p)]));
const palette = () => {
  const out = {};
  for (const p of Object.keys(flat)) {
    if (!p.startsWith('color.')) continue;
    const [, fam, step] = p.split('.');
    (out[fam] ||= {})[step] = val(p);
  }
  return out;
};

function streamlit(name) {
  const t = theme(name);
  return `# Vici theme for Streamlit (${name}) — generated by scripts/build.mjs from src/tokens/tokens.json.
# Copy this file to .streamlit/config.toml in your app.
[theme]
base = "${name}"
primaryColor = "${t.accent}"
backgroundColor = "${t.bg}"
secondaryBackgroundColor = "${name === 'light' ? t['bg-subtle'] : t.surface}"
textColor = "${t.text}"
font = "sans serif"
`;
}

// A Streamlit helper that writes the profile-links byline with inline styles (Streamlit doesn't
// load Vici's stylesheet). Images come from the CDN, pinned to this release.
function streamlitByline() {
  const L = theme('light');
  const D = theme('dark');
  return `"""Vici byline for Streamlit: "Built by", Victor Pflüger's portrait in a hexagon, his name and
LinkedIn's [in] logo, as one link to his LinkedIn profile.

    import streamlit as st
    from vici_byline import vici_byline

    st.sidebar.markdown(vici_byline(), unsafe_allow_html=True)           # light theme
    st.sidebar.markdown(vici_byline(dark=True), unsafe_allow_html=True)  # dark theme

Streamlit doesn't load Vici's stylesheet, so everything is styled inline. The portrait and
LinkedIn's logo load from the jsDelivr CDN, pinned to Vici v${VERSION}. Generated by
scripts/build.mjs from src/tokens/tokens.json; see Brand > Profile links in the Vici docs.
The portrait and LinkedIn's logo are not covered by Vici's MIT licence (see LICENSE).
"""
from html import escape

VICI = "https://cdn.jsdelivr.net/gh/VictorPflueger/ViciDesign@v${VERSION}"
LINKEDIN = "https://www.linkedin.com/in/victorpflueger"
HEXAGON = "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)"
HIDDEN = "position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap"


def vici_byline(dark: bool = False, label: str = "Built by") -> str:
    """HTML for st.markdown(..., unsafe_allow_html=True). dark=True for a dark Streamlit theme."""
    ink, muted = ("${D.text}", "${D['text-muted']}") if dark else ("${L.text}", "${L['text-muted']}")
    logo = "linkedin-white.png" if dark else "linkedin.png"
    return (
        f'<p style="display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin:0;'
        f'font-size:14px;line-height:1.3;color:{muted}">'
        f"<span>{escape(label)}</span>"
        f'<a href="{LINKEDIN}" rel="me" style="display:inline-flex;align-items:center;gap:8px;'
        f'color:{ink};font-weight:600;text-decoration:none">'
        f'<img src="{VICI}/assets/brand/portrait-96.jpg" alt="" width="28" height="24" '
        f'style="width:28px;height:24px;object-fit:cover;clip-path:{HEXAGON}">'
        "<span>Victor Pflüger</span>"
        f'<img src="{VICI}/assets/marks/{logo}" alt="" height="21" style="height:21px;width:auto;margin-left:4px">'
        f'<span style="{HIDDEN}"> on LinkedIn</span>'
        "</a></p>"
    )
`;
}

function powerbi(name) {
  const t = theme(name);
  const data = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => t[`data-${i}`]);
  const font = 'Segoe UI';
  return JSON.stringify(
    {
      name: `Vici ${name === 'light' ? 'Light' : 'Dark'}`,
      dataColors: data,
      foreground: t.text,
      foregroundNeutralSecondary: t['text-muted'],
      foregroundNeutralTertiary: t['text-subtle'],
      background: t.surface,
      backgroundLight: t['bg-subtle'],
      backgroundNeutral: t.border,
      tableAccent: name === 'light' ? val('color.merlot.700') : t.accent,
      good: t['success-solid'],
      neutral: t['warning-solid'],
      bad: t['danger-solid'],
      maximum: t['seq-7'],
      center: t['seq-4'],
      minimum: t['seq-1'],
      null: t['data-7'],
      hyperlink: t['text-link'],
      visitedHyperlink: t['accent-text'],
      textClasses: {
        callout: { fontSize: 28, fontFace: `${font} Semibold`, color: t.text },
        title: { fontSize: 12, fontFace: `${font} Semibold`, color: t.text },
        header: { fontSize: 12, fontFace: `${font} Semibold`, color: t.text },
        label: { fontSize: 10, fontFace: font, color: t['text-muted'] },
      },
    },
    null,
    2,
  ) + '\n';
}

function pythonModule() {
  const L = theme('light');
  const D = theme('dark');
  const pick = (t, keys) => keys.map((k) => t[k]);
  const fmt = (o) => JSON.stringify(o, null, 4).replace(/"([^"]+)":/g, '"$1":');
  const cat = (t) => pick(t, ['data-1', 'data-2', 'data-3', 'data-4', 'data-5', 'data-6']);
  const seq = (t) => pick(t, ['seq-1', 'seq-2', 'seq-3', 'seq-4', 'seq-5', 'seq-6', 'seq-7']);
  const div = (t) => pick(t, ['div-1', 'div-2', 'div-3', 'div-4', 'div-5', 'div-6', 'div-7']);
  return `"""Vici palette for Python charts — generated by scripts/build.mjs, do not edit.

    from vici_palette import CATEGORICAL, use_matplotlib, plotly_template
    use_matplotlib()                      # light theme defaults for matplotlib
    fig.update_layout(template=plotly_template("dark"))
"""

VERSION = "${VERSION}"

COLORS = ${fmt(palette())}

LIGHT = ${fmt(L)}

DARK = ${fmt(D)}

CATEGORICAL = ${JSON.stringify(cat(L))}
CATEGORICAL_DARK = ${JSON.stringify(cat(D))}
SEQUENTIAL = ${JSON.stringify(seq(L))}
SEQUENTIAL_DARK = ${JSON.stringify(seq(D))}
DIVERGING = ${JSON.stringify(div(L))}
DIVERGING_DARK = ${JSON.stringify(div(D))}

FONT_FAMILY = ["Inter", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"]


def theme(name="light"):
    """Return the semantic colour dict for 'light' or 'dark'."""
    if name not in ("light", "dark"):
        raise ValueError("theme must be 'light' or 'dark'")
    return LIGHT if name == "light" else DARK


def use_matplotlib(name="light"):
    """Apply Vici colours and typography to matplotlib's rcParams."""
    import matplotlib as mpl
    from cycler import cycler

    t = theme(name)
    series = CATEGORICAL if name == "light" else CATEGORICAL_DARK
    mpl.rcParams.update({
        "axes.prop_cycle": cycler(color=series),
        "figure.facecolor": t["surface"],
        "axes.facecolor": t["surface"],
        "savefig.facecolor": t["surface"],
        "axes.edgecolor": t["chart-grid"],
        "axes.labelcolor": t["text-muted"],
        "axes.titlecolor": t["text"],
        "axes.grid": True,
        "grid.color": t["chart-grid"],
        "grid.linewidth": 0.8,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "xtick.color": t["chart-axis"],
        "ytick.color": t["chart-axis"],
        "text.color": t["text"],
        "font.family": "sans-serif",
        "font.sans-serif": FONT_FAMILY,
        "lines.linewidth": 2,
        "lines.marker": "h",
        "lines.markersize": 5,
        "scatter.marker": "h",
    })


def plotly_template(name="light"):
    """Return a plotly layout template using the Vici palette."""
    import plotly.graph_objects as go

    t = theme(name)
    return go.layout.Template(layout=dict(
        colorway=CATEGORICAL if name == "light" else CATEGORICAL_DARK,
        font=dict(family=", ".join(FONT_FAMILY), color=t["text"]),
        paper_bgcolor=t["surface"],
        plot_bgcolor=t["surface"],
        xaxis=dict(gridcolor=t["chart-grid"], linecolor=t["chart-grid"], tickfont=dict(color=t["chart-axis"])),
        yaxis=dict(gridcolor=t["chart-grid"], linecolor=t["chart-grid"], tickfont=dict(color=t["chart-axis"])),
        colorscale=dict(sequential=SEQUENTIAL if name == "light" else SEQUENTIAL_DARK,
                        diverging=DIVERGING if name == "light" else DIVERGING_DARK),
    ))
`;
}

function tailwindTheme() {
  const lines = [];
  for (const [fam, steps] of Object.entries(palette())) {
    for (const [step, hex] of Object.entries(steps)) lines.push(`  --color-${fam}-${step}: ${hex};`);
  }
  const fam = (k) => cssValue(flat[`font.family.${k}`], `font.family.${k}`);
  lines.push(`  --font-display: ${fam('display')};`, `  --font-sans: ${fam('text')};`, `  --font-mono: ${fam('mono')};`);
  for (const p of Object.keys(flat).filter((x) => x.startsWith('radius.'))) lines.push(`  --radius-${p.split('.')[1]}: ${val(p)};`);
  for (const p of Object.keys(flat).filter((x) => x.startsWith('easing.'))) lines.push(`  --ease-${p.split('.')[1]}: cubic-bezier(${val(p).join(', ')});`);
  for (const p of Object.keys(flat).filter((x) => x.startsWith('breakpoint.'))) lines.push(`  --breakpoint-${p.split('.')[1]}: ${val(p)};`);
  lines.push('  --spacing: 4px;');
  return `/* Vici tokens as a Tailwind CSS v4 theme — generated by scripts/build.mjs.
   @import "tailwindcss";
   @import "./vici-theme.css";
   Then: bg-merlot-950 text-neutral-50 font-display rounded-md … (load the fonts via dist/vici.css or assets/fonts). */
@theme {
${lines.join('\n')}
}
`;
}

function tokensJson() {
  const out = { version: VERSION, color: palette(), light: theme('light'), dark: theme('dark') };
  for (const [path, tok] of Object.entries(flat)) {
    if (path.startsWith('color.') || path.startsWith('theme.')) continue;
    const parts = path.split('.');
    let node = out;
    for (const k of parts.slice(0, -1)) node = node[k] ||= {};
    node[parts.at(-1)] = resolve(flat, tok.value);
  }
  return JSON.stringify(out, null, 2) + '\n';
}

// ------------------------------------------------------------------ build
const css = bundleCss();
const minCss = minifyCss(css);
emit('dist/vici.css', css);
emit('dist/vici.min.css', minCss);
emit('dist/vici-tokens.css', tokensCss());
emit('dist/vici.js', read('src/js/vici.js'));
emit('dist/vici-icons.svg', iconSprite());
emit('dist/tokens.json', tokensJson());
emit('integrations/streamlit/config.toml', streamlit('light'));
emit('integrations/streamlit/config-dark.toml', streamlit('dark'));
emit('integrations/streamlit/vici_byline.py', streamlitByline());
emit('integrations/powerbi/vici-light.json', powerbi('light'));
emit('integrations/powerbi/vici-dark.json', powerbi('dark'));
emit('integrations/python/vici_palette.py', pythonModule());
emit('integrations/tailwind/vici-theme.css', tailwindTheme());

for (const [path, content] of buildLogos({ root: ROOT })) emit(path, content);
for (const [path, content] of renderDocs({ root: ROOT, version: VERSION, tokens, flat, icons, stats: { minCss: Buffer.byteLength(minCss), gzCss: gzipSync(minCss, { level: 9 }).length } })) emit(path, content);

// ------------------------------------------------------------ write / check
const GENERATED_HTML_MARKER = '<meta name="generator" content="vici-build">';
function generatedHtmlOnDisk() {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir))) {
      const rel = dir ? `${dir}/${entry}` : entry;
      if (/^(node_modules|\.git|\.unlazy|src|dist|assets|scripts|integrations)$/.test(rel)) continue;
      const abs = join(ROOT, rel);
      if (statSync(abs).isDirectory()) walk(rel);
      else if (entry.endsWith('.html') && readFileSync(abs, 'utf8').includes(GENERATED_HTML_MARKER)) found.push(rel);
    }
  };
  walk('');
  return found;
}

// Everything in assets/logo/ is generated, so a file there without a source is left over.
function logoFilesOnDisk(dir = 'assets/logo') {
  if (!existsSync(join(ROOT, dir))) return [];
  return readdirSync(join(ROOT, dir)).flatMap((entry) => {
    const rel = `${dir}/${entry}`;
    return statSync(join(ROOT, rel)).isDirectory() ? logoFilesOnDisk(rel) : [rel];
  });
}

if (CHECK) {
  const stale = [];
  for (const [path, content] of outputs) {
    const abs = join(ROOT, path);
    if (!existsSync(abs)) { stale.push(`missing  ${path}`); continue; }
    const disk = readFileSync(abs);
    const fresh = Buffer.isBuffer(content) ? content : Buffer.from(content);
    if (!disk.equals(fresh)) stale.push(`changed  ${path}`);
  }
  for (const path of generatedHtmlOnDisk()) if (!outputs.has(path)) stale.push(`orphan   ${path}`);
  for (const path of logoFilesOnDisk()) if (!outputs.has(path)) stale.push(`orphan   ${path}`);
  if (stale.length) {
    console.error(stale.join('\n'));
    console.error(`\n${stale.length} generated file(s) out of date — run: node scripts/build.mjs`);
    process.exit(1);
  }
  console.log(`${outputs.size} generated files match their sources.`);
  console.log('BUILD UP TO DATE');
} else {
  // remove logo files whose source is gone, then any folders that left empty
  for (const path of logoFilesOnDisk()) if (!outputs.has(path)) rmSync(join(ROOT, path));
  const pruneEmpty = (dir) => {
    const abs = join(ROOT, dir);
    for (const entry of readdirSync(abs)) if (statSync(join(abs, entry)).isDirectory()) pruneEmpty(`${dir}/${entry}`);
    if (dir !== 'assets/logo' && readdirSync(abs).length === 0) rmdirSync(abs);
  };
  if (existsSync(join(ROOT, 'assets/logo'))) pruneEmpty('assets/logo');
  for (const [path, content] of outputs) {
    const abs = join(ROOT, path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  console.log(`Built ${outputs.size} files (v${VERSION}).`);
}
