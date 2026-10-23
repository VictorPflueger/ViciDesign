// Logo suggestions for Victor Pflüger, generated from geometry so every variant stays exact.
// Inspiration: the node-path "V" of the personal website mark, translated into Vici's
// hexagon language. Every round node becomes a flat-top hexagon; strokes follow the
// 60° lattice of the honeycomb.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const C = {
  ink: '#250010', // merlot-950 — the base colour
  wine: '#5c1230', // merlot-800
  rose: '#8f2f42', // merlot-700
  dusty: '#c77d74', // merlot-500
  blush: '#f4b9bb', // merlot-300
  petal: '#fcd2d5', // merlot-200
  linen: '#f3ebe7', // neutral-100
  paper: '#fbf7f5', // neutral-50
  lilac: '#dbc6f0', // lilac-300
  apricot: '#f3c6a4', // apricot-300
};

const r2 = (n) => Math.round(n * 100) / 100;
const deg = (a) => (a * Math.PI) / 180;

/** Hexagon corner points; flat-top by default (a vertex at 0°). */
export function hexPoints(cx, cy, r, pointy = false) {
  const off = pointy ? 30 : 0;
  return [0, 60, 120, 180, 240, 300].map((a) => [r2(cx + r * Math.cos(deg(a + off))), r2(cy + r * Math.sin(deg(a + off)))]);
}
const pts = (p) => p.map(([x, y]) => `${x},${y}`).join(' ');
const pathOf = (p) => 'M' + p.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z';
const ring = (cx, cy, r, t, pointy = false) => `${pathOf(hexPoints(cx, cy, r, pointy))} ${pathOf(hexPoints(cx, cy, r - t / Math.cos(deg(30)), pointy))}`;

function svg(viewBox, body, { title, width, height, extraAttrs = '' } = {}) {
  const [, , w, h] = viewBox.split(' ').map(Number);
  const size = width ? ` width="${width}" height="${height ?? r2((width * h) / w)}"` : '';
  const t = title ? `<title>${title}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${size}${title ? ' role="img"' : ' aria-hidden="true" focusable="false"'}${extraAttrs}>${t}${body}</svg>\n`;
}

// ------------------------------------------------------------------ 1 · Vertex
// A V drawn as a path through three hexagonal data nodes: a solid start, a ring at the
// apex and a pastel ring as the goal — the website mark, rebuilt on the honeycomb lattice.
function vertexGeometry(cx, cy, len) {
  // apex at the bottom, arms at ±60° (an equilateral V)
  const ax = cx;
  const ay = cy + (len * Math.sin(deg(60))) / 2;
  const L = [ax - len / 2, ay - len * Math.sin(deg(60))];
  const R = [ax + len / 2, ay - len * Math.sin(deg(60))];
  return { A: [ax, ay], L, R };
}

function vertexParts({ len = 52, cx = 60, cy = 52, k = 1, pointy = true } = {}) {
  const { A, L, R } = vertexGeometry(cx, cy, len);
  const sw = 6.2 * k;
  const rStart = 8.6 * k;
  const rApex = 8.6 * k;
  const tApex = 4 * k;
  const rGoal = 12 * k;
  const tGoal = 4 * k;
  const unit = [Math.cos(deg(60)), Math.sin(deg(60))]; // direction from L down to A
  // Pointy-top nodes: the 60° arms meet their faces at right angles.
  const inner = (r) => r * Math.cos(deg(30)); // apothem
  const leftFrom = [L[0] + unit[0] * inner(rStart) * 0.5, L[1] + unit[1] * inner(rStart) * 0.5];
  const leftTo = [A[0] - unit[0] * (inner(rApex) - 0.6), A[1] - unit[1] * (inner(rApex) - 0.6)];
  const rightFrom = [A[0] + unit[0] * (inner(rApex) - 0.6), A[1] - unit[1] * (inner(rApex) - 0.6)];
  const gap = inner(rGoal) + 3.6 * k;
  const rightTo = [R[0] - unit[0] * gap, R[1] + unit[1] * gap];
  const box = {
    x: L[0] - rStart * (pointy ? Math.cos(deg(30)) : 1),
    y: Math.min(L[1] - rStart, R[1] - rGoal),
    x2: R[0] + rGoal * (pointy ? Math.cos(deg(30)) : 1),
    y2: A[1] + rApex,
  };
  return { A, L, R, sw, rStart, rApex, tApex, rGoal, tGoal, leftFrom, leftTo, rightFrom, rightTo, pointy, box };
}

function vertexBody({ stroke, start, apex, goal, ...geo }) {
  const g = vertexParts(geo);
  const line = (a, b) => `<path d="M${r2(a[0])} ${r2(a[1])} L${r2(b[0])} ${r2(b[1])}" fill="none" stroke="${stroke}" stroke-width="${r2(g.sw)}" stroke-linecap="butt"/>`;
  return [
    line(g.leftFrom, g.leftTo),
    line(g.rightFrom, g.rightTo),
    `<polygon points="${pts(hexPoints(g.L[0], g.L[1], g.rStart, g.pointy))}" fill="${start}"/>`,
    `<path d="${ring(g.A[0], g.A[1], g.rApex, g.tApex, g.pointy)}" fill="${apex}" fill-rule="evenodd"/>`,
    `<path d="${ring(g.R[0], g.R[1], g.rGoal, g.tGoal, g.pointy)}" fill="${goal}" fill-rule="evenodd"/>`,
  ].join('');
}

const VERTEX_BOX = (() => {
  const { box } = vertexParts();
  const pad = 2;
  return { x: r2(box.x - pad), y: r2(box.y - pad), w: r2(box.x2 - box.x + 2 * pad), h: r2(box.y2 - box.y + 2 * pad) };
})();
const vb = (b) => `${b.x} ${b.y} ${b.w} ${b.h}`;

function vertexSymbol(variant) {
  const scheme = {
    color: { stroke: C.ink, start: C.ink, apex: C.ink, goal: C.dusty },
    dark: { stroke: C.linen, start: C.linen, apex: C.linen, goal: C.blush },
    mono: { stroke: C.ink, start: C.ink, apex: C.ink, goal: C.ink },
  }[variant];
  return svg(vb(VERTEX_BOX), vertexBody(scheme), { title: 'Vertex — Victor Pflüger' });
}

function vertexTile() {
  const tile = `<polygon points="${pts(hexPoints(60, 51.96, 60))}" fill="${C.ink}"/>`;
  // centre the V's bounding box in the tile
  const geo = { len: 56, k: 1.02, cx: 60, cy: 52 };
  const b = vertexParts(geo).box;
  geo.cx += 60 - (b.x + b.x2) / 2;
  geo.cy += 51.96 - (b.y + b.y2) / 2 + 1.5;
  return svg('0 0 120 103.92', tile + vertexBody({ stroke: C.linen, start: C.linen, apex: C.linen, goal: C.blush, ...geo }), { title: 'Vertex app icon' });
}

// Small-size cut for favicons (16–32 px): heavier strokes, solid nodes, no counters.
function vertexFavicon() {
  const tile = `<polygon points="${pts(hexPoints(60, 51.96, 60))}" fill="${C.ink}"/>`;
  const geo = { len: 50, cx: 60, cy: 52 };
  const g = vertexParts(geo);
  const sw = 11;
  const node = (c, r, fill) => `<polygon points="${pts(hexPoints(c[0], c[1], r, true))}" fill="${fill}"/>`;
  const dy = 51.96 - (g.box.y + g.box.y2) / 2 + 2;
  const sh = ([x, y]) => [r2(x), r2(y + dy)];
  const [L, A, R] = [sh(g.L), sh(g.A), sh(g.R)];
  const unit = [Math.cos(deg(60)), Math.sin(deg(60))];
  const stop = [R[0] - unit[0] * 17, R[1] + unit[1] * 17];
  const body = `<path d="M${L[0]} ${L[1]} L${A[0]} ${A[1]} L${r2(stop[0])} ${r2(stop[1])}" fill="none" stroke="${C.linen}" stroke-width="${sw}" stroke-linejoin="bevel"/>${node(L, 11, C.linen)}${node(A, 10, C.linen)}${node(R, 13, C.blush)}`;
  return svg('0 0 120 103.92', tile + body, { title: 'Vici' });
}

// ------------------------------------------------------------------ 2 · Facet
// Three rhombi of one hexagon — the isometric "data cube". The two lower faces meet in a V,
// the top face is lifted out in pastel: a building block, seen from above.
function facetBody({ left, right, top, gap = 2.4 }) {
  const cx = 52;
  const cy = 60;
  const r = 50;
  const P = hexPoints(cx, cy, r, true); // pointy-top: [0]=30°(lower right) ... order: 30,90,150,210,270,330
  // name the corners
  const lowerRight = P[0];
  const bottom = P[1];
  const lowerLeft = P[2];
  const upperLeft = P[3];
  const top0 = P[4];
  const upperRight = P[5];
  const C0 = [cx, cy];
  // shrink each face towards its own centroid to open hairline gaps between facets
  const shrink = (poly) => {
    const gx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
    const gy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    return poly.map(([x, y]) => {
      const dx = x - gx;
      const dy = y - gy;
      const d = Math.hypot(dx, dy);
      const k = (d - gap) / d;
      return [r2(gx + dx * k), r2(gy + dy * k)];
    });
  };
  const faceTop = shrink([top0, upperRight, C0, upperLeft]);
  const faceLeft = shrink([upperLeft, C0, bottom, lowerLeft]);
  const faceRight = shrink([C0, upperRight, lowerRight, bottom]);
  return `<polygon points="${pts(faceTop)}" fill="${top}"/><polygon points="${pts(faceLeft)}" fill="${left}"/><polygon points="${pts(faceRight)}" fill="${right}"/>`;
}

function facetSymbol(variant) {
  const scheme = {
    color: { left: C.ink, right: C.rose, top: C.blush },
    dark: { left: C.petal, right: C.dusty, top: C.lilac },
    mono: { left: C.ink, right: C.ink, top: C.ink },
  }[variant];
  return svg('8.7 8 86.6 104', facetBody(scheme), { title: 'Facet — Victor Pflüger' });
}

// --------------------------------------------------------------- 3 · Honeycomb
// Five cells of a honeycomb laid out as a V, fading from the base colour to pastel —
// a path through data, one cell at a time.
function honeycombBody(colors) {
  const s = 15; // cell circumradius (pointy-top cells so the arms run at 60°)
  const w = Math.sqrt(3) * s; // cell width
  const rowH = 1.5 * s;
  const cells = [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 1],
    [4, 0],
  ];
  const ox = w / 2 + 4;
  const oy = s + 4;
  const g = 1.6; // visual gap
  return cells
    .map(([col, row], i) => {
      const cx = ox + (col * w) / 2 + col * 0;
      const cy = oy + row * rowH;
      return `<polygon points="${pts(hexPoints(cx, cy, s - g, true))}" fill="${colors[i]}"/>`;
    })
    .join('');
}

function honeycombSymbol(variant) {
  const scheme = {
    color: [C.ink, C.wine, C.rose, C.dusty, C.blush],
    dark: [C.paper, C.petal, C.blush, C.dusty, C.rose],
    mono: [C.ink, C.ink, C.ink, C.ink, C.ink],
  }[variant];
  const s = 15;
  const w = Math.sqrt(3) * s;
  const width = r2(w * 3 + 8);
  const height = r2(2 * 1.5 * s + 2 * s + 8);
  return svg(`0 0 ${width} ${height}`, honeycombBody(scheme), { title: 'Honeycomb — Victor Pflüger' });
}

// ---------------------------------------------------------------- 4 · Monogram
// V and P drawn with one continuous line on the 60° lattice; the bowl of the P is half a
// hexagon, so the monogram can only belong to this system.
function monogramBody({ ink, accent, sw = 9 }) {
  // V: left arm from (14,14) down to apex (35,50.4); right arm rises at 60° back to the top
  // and becomes the stem of the P; the bowl is the right half of a flat-top hexagon.
  const top = 14;
  const apexY = 64;
  const h = apexY - top;
  const half = h * Math.tan(deg(30)); // horizontal run of a 60° arm
  const ax = 14 + half;
  const L = [14, top];
  const A = [ax, apexY];
  const S = [ax + half, top]; // top of the P stem
  const bowlH = 30; // height of the bowl (top half of the stem)
  const bowlW = bowlH / Math.sqrt(3); // depth of the half-hexagon bowl
  const B1 = [S[0] + bowlW * 0.62, top];
  const B2 = [S[0] + bowlW * 0.62 + bowlW * 0.5, top + bowlH / 2];
  const B3 = [S[0] + bowlW * 0.62, top + bowlH];
  // the P joins the stem where the bowl closes, on the right arm
  const tStem = (top + bowlH - top) / h; // fraction down the right arm
  const J = [S[0] - half * tStem, top + bowlH];
  const d = `M${r2(L[0])} ${r2(L[1])} L${r2(A[0])} ${r2(A[1])} L${r2(S[0])} ${r2(S[1])} L${r2(B1[0])} ${r2(B1[1])} L${r2(B2[0])} ${r2(B2[1])} L${r2(B3[0])} ${r2(B3[1])} L${r2(J[0])} ${r2(J[1])}`;
  // the counter of the bowl, inset by half the stroke, carries the accent colour
  const inset = sw / 2;
  const counter = [
    [S[0] - half * (inset / h) + inset * 0.6, top + inset],
    [B1[0] - inset * 0.58, top + inset],
    [B2[0] - inset * 1.15, top + bowlH / 2],
    [B3[0] - inset * 0.58, top + bowlH - inset],
    [J[0] + inset * 0.6, top + bowlH - inset],
  ];
  const fillCounter = accent ? `<polygon points="${pts(counter.map(([x, y]) => [r2(x), r2(y)]))}" fill="${accent}"/>` : '';
  return `${fillCounter}<path d="${d}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="miter" stroke-miterlimit="4" stroke-linecap="butt"/>`;
}

function monogramSymbol(variant) {
  const scheme = {
    color: { ink: C.ink, accent: C.blush },
    dark: { ink: C.linen, accent: C.rose },
    mono: { ink: C.ink, accent: '' },
  }[variant];
  return svg('6 6 92 64', monogramBody(scheme), { title: 'Monogram VP — Victor Pflüger' });
}

// ---------------------------------------------------------------- 5 · Wordmark
function wordmarks(root) {
  return JSON.parse(readFileSync(join(root, 'src/brand/wordmarks.json'), 'utf8'));
}

function wordmarkSvg(wm, fill, title) {
  // font units → px: cap height 660 → 40px tall caps
  const pad = 20;
  const top = -wm.capHeight - 60; // room above caps for umlaut dots
  const bottom = -wm.descender + 10; // descenders
  const vb = `${-pad} ${top} ${wm.advance + 2 * pad} ${bottom - top}`;
  return svg(vb, `<path d="${wm.d}" fill="${fill}"/>`, { title });
}

function lockupSvg(symbolBody, symbolBox, wm, { symbolScale = 1, fill, title }) {
  // Horizontal lockup: symbol on the left, wordmark aligned to the symbol's optical centre.
  const capPx = 660;
  const s = (capPx * 2.05) / symbolBox.h; // symbol height ≈ 2 × cap height
  const symW = symbolBox.w * s * symbolScale;
  const symH = symbolBox.h * s * symbolScale;
  const gap = capPx * 0.6;
  const textX = symW + gap;
  const baseline = symH / 2 + capPx / 2;
  const width = textX + wm.advance + 30;
  const body = `<g transform="translate(0 0) scale(${r2(s * symbolScale)}) translate(${-symbolBox.x} ${-symbolBox.y})">${symbolBody}</g><g transform="translate(${r2(textX)} ${r2(baseline)})"><path d="${wm.d}" fill="${fill}"/></g>`;
  return svg(`0 -10 ${r2(width)} ${r2(symH + 20)}`, body, { title });
}

// ------------------------------------------------------------------ exports
/** Inline header mark that follows the page theme (uses Vici CSS variables). */
export function logoMarkSvg({ size = 32, title = true } = {}) {
  const body = vertexBody({ stroke: 'var(--vc-text)', start: 'var(--vc-text)', apex: 'var(--vc-text)', goal: 'var(--vc-merlot-500)' })
    .replace(/stroke="(var\([^"]+\))"/g, 'style="stroke:$1"')
    .replace(/fill="(var\([^"]+\))"/g, 'style="fill:$1"');
  const height = size;
  const width = r2((size * VERTEX_BOX.w) / VERTEX_BOX.h);
  return svg(vb(VERTEX_BOX), body, { title: title ? 'Vici' : '', width, height, extraAttrs: ' class="vc-logo"' }).trim();
}

export const LOGO_CONCEPTS = [
  { id: 'vertex', name: 'Vertex', recommended: true },
  { id: 'facet', name: 'Facet' },
  { id: 'honeycomb', name: 'Honeycomb' },
  { id: 'monogram', name: 'Monogram' },
  { id: 'wordmark', name: 'Wordmark' },
];

export function buildLogos({ root }) {
  const wm = wordmarks(root);
  const files = [];
  const add = (p, c) => files.push([`assets/logo/${p}`, c]);
  for (const v of ['color', 'dark', 'mono']) {
    add(`vertex/${v}.svg`, vertexSymbol(v));
    add(`facet/${v}.svg`, facetSymbol(v));
    add(`honeycomb/${v}.svg`, honeycombSymbol(v));
    add(`monogram/${v}.svg`, monogramSymbol(v));
  }
  add('vertex/tile.svg', vertexTile());
  add('favicon.svg', vertexFavicon());
  add('wordmark/color.svg', wordmarkSvg(wm['victor-pflueger'], C.ink, 'Victor Pflüger'));
  add('wordmark/dark.svg', wordmarkSvg(wm['victor-pflueger'], C.linen, 'Victor Pflüger'));
  add('wordmark/mono.svg', wordmarkSvg(wm['victor-pflueger'], '#000000', 'Victor Pflüger'));
  add('wordmark/vici.svg', wordmarkSvg(wm.vici, C.ink, 'Vici'));
  const vBox = VERTEX_BOX;
  add('vertex/lockup.svg', lockupSvg(vertexBody({ stroke: C.ink, start: C.ink, apex: C.ink, goal: C.dusty }), vBox, wm['victor-pflueger'], { fill: C.ink, title: 'Victor Pflüger' }));
  add('vertex/lockup-dark.svg', lockupSvg(vertexBody({ stroke: C.linen, start: C.linen, apex: C.linen, goal: C.blush }), vBox, wm['victor-pflueger'], { fill: C.linen, title: 'Victor Pflüger' }));
  return files;
}

/** Inline "Vici" wordmark (hexagon tittles) in currentColor, for page headers. */
export function viciWordmarkSvg(root, { height = 22, title = 'Vici' } = {}) {
  const wm = wordmarks(root).vici;
  const top = -wm.capHeight - 52;
  const vbH = wm.capHeight + 52 + 8;
  const width = r2((height * (wm.advance + 8)) / vbH);
  return svg(`-4 ${top} ${wm.advance + 8} ${vbH}`, `<path d="${wm.d}" style="fill:currentColor"/>`, { title, width, height, extraAttrs: ' class="vc-wordmark"' }).trim();
}
