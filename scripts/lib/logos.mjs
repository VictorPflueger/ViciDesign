// Victor Pflüger's logo (Vertex), wordmarks, monogram options and the archived concepts,
// generated from geometry so every variant stays exact. Inspiration for the symbol: the
// node-path "V" of the personal website mark, translated into Vici's hexagon language.
// Every round node becomes a hexagon; strokes follow the 60° lattice of the honeycomb.
// This file is part of Victor Pflüger's personal brand and is not MIT-licensed: its coordinates
// and colours are the designs. All rights reserved (see LICENSE, section 2).

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

// --------------------------------------------------------------- 4 · Monogram
// Five directions for a VP monogram, to choose from. Ligature, Stem and Seal share one
// lattice: cap height 100 units, every diagonal at 60° (the angle of the honeycomb and of
// Vertex's arms), flat terminals on the cap line, and a P whose bowl is a hexagonal D: four
// sides of a flat-top hexagon, its slanted sides parallel to the V's arms. Cell's bowl is a
// whole pointy-top hexagon like Vertex's nodes; Initials uses the wordmark's typeface.
const S3 = Math.sqrt(3);
const MONO_W = 16; // stroke across an arm or stem, on a cap height of 100
const UNDERLAP = 0.8; // pastel counters reach this far under the ink, so no hairline seam shows

const pathD = (poly) => 'M' + poly.map(([x, y]) => `${r2(x)} ${r2(y)}`).join(' L') + ' Z';

function cross([x1, y1], [x2, y2], [x3, y3], [x4, y4]) {
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

/** Moves every edge of a convex polygon inwards by d (the counter of a stroked shape). */
function insetPolygon(poly, d) {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1];
  const sgn = area > 0 ? 1 : -1;
  const edges = poly.map((p, i) => {
    const q = poly[(i + 1) % n];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const nx = (-sgn * (q[1] - p[1])) / len;
    const ny = (sgn * (q[0] - p[0])) / len;
    return [[p[0] + nx * d, p[1] + ny * d], [q[0] + nx * d, q[1] + ny * d]];
  });
  return edges.map((e, i) => cross(...edges[(i - 1 + n) % n], ...e));
}

/** V with 60° arms; outer top-left corner at (x, 0), apex on the baseline y = h. */
function chevron(x, h, w) {
  const t = (2 * w) / S3; // horizontal thickness of a 60° arm
  const run = h / S3; // horizontal run of an arm over the full height
  return { poly: [[x, 0], [x + t, 0], [x + run, h - 2 * w], [x + 2 * run - t, 0], [x + 2 * run, 0], [x + run, h]], right: x + 2 * run, t };
}

/** P on a stem at x: a hexagonal-D bowl of height b whose top edge reaches `ext` past the stem. */
function hexBowlP(x, h, w, { b = 58, ext = 27 } = {}) {
  const X1 = x + w + ext;
  const X2 = X1 + b / 2 / S3;
  const bowlOutline = [[x, 0], [X1, 0], [X2, b / 2], [X1, b], [x, b]];
  const counter = insetPolygon(bowlOutline, w);
  counter[0][0] = x + w; // the counter starts at the inside of the stem
  counter[4][0] = x + w;
  const outline = [[x, 0], [X1, 0], [X2, b / 2], [X1, b], [x + w, b], [x + w, h], [x, h]];
  return { outline, counter, right: X2 };
}

const part = (role, polys, evenodd = false) => ({ role, d: polys.map(pathD).join(' '), evenodd });

// 4a · Ligature: the V's right arm runs into the P's top corner, so the two letters share one
// sharp junction and read as a single sign.
function monoLigature() {
  const V = chevron(0, 100, MONO_W);
  const P = hexBowlP(V.right - V.t, 100, MONO_W); // the arm's inner top corner is the stem's corner
  return { parts: [part('accent', [insetPolygon(P.counter, -UNDERLAP)]), part('ink', [V.poly]), part('ink', [P.outline, P.counter], true)], box: { x: 0, y: 0, x2: P.right, y2: 100 } };
}

// 4b · Stem: the V's second arm stands upright and is the P's stem. The most compact cut.
function monoStem() {
  const w = MONO_W;
  const t = (2 * w) / S3;
  const xs = 100 / S3; // the arm reaches the stem's foot
  const yJoin = (xs - t) * S3; // where the arm's inner edge meets the stem
  const b = 58;
  const X1 = xs + w + 27;
  const X2 = X1 + b / 2 / S3;
  const outline = [[0, 0], [t, 0], [xs, yJoin], [xs, 0], [X1, 0], [X2, b / 2], [X1, b], [xs + w, b], [xs + w, 100], [xs, 100]];
  const counter = insetPolygon([[xs, 0], [X1, 0], [X2, b / 2], [X1, b], [xs, b]], w);
  counter[0][0] = xs + w;
  counter[4][0] = xs + w;
  return { parts: [part('accent', [insetPolygon(counter, -UNDERLAP)]), part('ink', [outline, counter], true)], box: { x: 0, y: 0, x2: X2, y2: 100 } };
}

// 4c · Cell: the P's bowl is a whole hexagon cell, and its pastel centre is Vertex's goal node.
function monoCell() {
  const w = MONO_W;
  const R = 32; // the cell's circumradius: the bowl is 64 % of the cap height
  const V = chevron(0, 100, w);
  const xs = V.right;
  const cx = xs + (S3 / 2) * R;
  const H = hexPoints(cx, R, R, true); // pointy-top: its left side is upright and doubles as the stem
  const join = [xs + w, H[2][1] + w / S3]; // where the stem leaves the cell's lower left edge
  const outline = [H[4], H[5], H[0], H[1], join, [xs + w, 100], [xs, 100], H[2], H[3]];
  const counter = hexPoints(cx, R, R - w / (S3 / 2), true);
  return { parts: [part('accent', [hexPoints(cx, R, R - (w - UNDERLAP) / (S3 / 2), true)]), part('ink', [V.poly]), part('ink', [outline, counter], true)], box: { x: 0, y: 0, x2: H[0][0], y2: 100 } };
}

// 4d · Seal: the initials inside a thin hexagon ring, like a stamp or a signet.
function monoSeal() {
  const R = 60;
  const ringT = 4;
  const w = 13;
  const V = chevron(0, 100, w);
  const P = hexBowlP(V.right + 5, 100, w, { b: 56, ext: 22 });
  const s = (0.44 * S3 * R) / 100;
  const cx = R;
  const cy = (S3 * R) / 2;
  // centred optically, not by the bounding box: the V's top corners reach towards the ring's
  // slanted sides while the P's bowl point sits at mid-height, so the letters move right a little
  const optical = 3.2;
  const tx = cx - (P.right / 2) * s + optical;
  const ty = cy - 50 * s;
  const T = (poly) => poly.map(([x, y]) => [tx + x * s, ty + y * s]);
  return {
    parts: [
      part('frame', [hexPoints(cx, cy, R), hexPoints(cx, cy, R - (2 * ringT) / S3)], true),
      part('ink', [T(V.poly)]),
      part('ink', [T(P.outline), T(P.counter)], true),
    ],
    box: { x: 0, y: 0, x2: 2 * R, y2: S3 * R },
    framed: true,
  };
}

// 4e · Initials: V and P from the wordmark's typeface, closed by a hexagon point.
function monoInitials(root) {
  const wm = wordmarks(root).initials;
  const k = 100 / wm.capHeight; // font units → monogram units
  const h = 0.62 * wm.point.d * k; // flat-top hexagon, a little lighter than the type's own stop
  const cx = wm.point.cx * k;
  const point = hexPoints(cx, -h / 2, h / S3); // sits on the baseline (y = 0)
  const letters = { role: 'ink', d: wm.d, evenodd: false, transform: `translate(0 100) scale(${r2(k * 10000) / 10000})` };
  return { parts: [letters, { role: 'point', d: pathD(point.map(([x, y]) => [x, y + 100])) }], box: { x: 0, y: 0, x2: cx + h / S3, y2: 100 } };
}

const MONO_COLORS = {
  color: { ink: C.ink, accent: C.blush, frame: C.dusty, point: C.dusty },
  dark: { ink: C.linen, accent: C.dusty, frame: C.blush, point: C.blush },
  mono: { ink: C.ink, accent: '', frame: C.ink, point: C.ink },
  tile: { ink: C.linen, accent: C.blush, frame: '', point: C.blush },
};

function monoParts(m, colors) {
  return m.parts
    .filter((p) => colors[p.role])
    .map((p) => `<path${p.transform ? ` transform="${p.transform}"` : ''} d="${p.d}" fill="${colors[p.role]}"${p.evenodd ? ' fill-rule="evenodd"' : ''}/>`)
    .join('');
}

function monogramSvg(m, variant, name) {
  const colors = MONO_COLORS[variant];
  const title = `Monogram VP, ${name} — Victor Pflüger`;
  if (variant !== 'tile') {
    const b = m.box;
    const pad = m.framed ? 0 : 6;
    return svg(`${r2(b.x - pad)} ${r2(b.y - pad)} ${r2(b.x2 - b.x + 2 * pad)} ${r2(b.y2 - b.y + 2 * pad)}`, monoParts(m, colors), { title });
  }
  // Tile: the app icon and avatar version, the letters in a merlot cell.
  const R = 60;
  const H = S3 * R;
  const tile = `<polygon points="${pts(hexPoints(R, H / 2, R))}" fill="${C.ink}"/>`;
  if (m.framed) {
    // the seal's ring moves inside the cell
    const ring = `<path d="${pathD(hexPoints(R, H / 2, R - 7))} ${pathD(hexPoints(R, H / 2, R - 7 - 4 / (S3 / 2)))}" fill="${C.blush}" fill-rule="evenodd"/>`;
    const inner = m.parts.filter((p) => p.role !== 'frame');
    const k = 0.84;
    return svg(`0 0 ${2 * R} ${r2(H)}`, tile + ring + `<g transform="translate(${r2(R * (1 - k))} ${r2((H / 2) * (1 - k))}) scale(${k})">${monoParts({ parts: inner }, colors)}</g>`, { title });
  }
  const b = m.box;
  const bw = b.x2 - b.x;
  const bh = b.y2 - b.y;
  // the largest letter block that keeps a margin inside the cell, at most 46 % of its height
  const margin = 12;
  const s = Math.min((0.46 * H) / bh, (R - margin) / (bw / 2 + bh / (2 * S3)));
  const tx = R - (b.x + bw / 2) * s;
  const ty = H / 2 - (b.y + bh / 2) * s;
  return svg(`0 0 ${2 * R} ${r2(H)}`, tile + `<g transform="translate(${r2(tx)} ${r2(ty)}) scale(${r2(s * 10000) / 10000})">${monoParts(m, colors)}</g>`, { title });
}

export const MONOGRAMS = [
  { id: 'ligature', name: 'Ligature', make: monoLigature },
  { id: 'stem', name: 'Stem', make: monoStem },
  { id: 'cell', name: 'Cell', make: monoCell },
  { id: 'seal', name: 'Seal', make: monoSeal },
  { id: 'initials', name: 'Initials', make: monoInitials },
];

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

export function buildLogos({ root }) {
  const wm = wordmarks(root);
  const files = [];
  const add = (p, c) => files.push([`assets/logo/${p}`, c]);
  for (const v of ['color', 'dark', 'mono']) {
    add(`vertex/${v}.svg`, vertexSymbol(v));
    add(`archive/facet/${v}.svg`, facetSymbol(v));
    add(`archive/honeycomb/${v}.svg`, honeycombSymbol(v));
  }
  for (const { id, name, make } of MONOGRAMS) {
    const m = make(root);
    for (const v of ['color', 'dark', 'mono', 'tile']) add(`monogram/${id}/${v}.svg`, monogramSvg(m, v, name));
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
