// Colour maths for Vici: sRGB <-> OKLab/OKLCH, gamut mapping, WCAG contrast.
// Formulas: OKLab by Björn Ottosson (public domain reference), WCAG 2.x relative luminance.

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
}

export function rgbToHex(rgb) {
  return '#' + rgb.map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0')).join('');
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToOklab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToLinearRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function oklchToOklab([L, C, h]) {
  const r = (h * Math.PI) / 180;
  return [L, C * Math.cos(r), C * Math.sin(r)];
}

export function oklabToOklch([L, a, b]) {
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [L, C, h];
}

export const hexToOklch = (hex) => oklabToOklch(rgbToOklab(hexToRgb(hex)));

const inGamut = (lin) => lin.every((v) => v >= -1e-6 && v <= 1 + 1e-6);

/** OKLCH -> hex. Out-of-gamut colours keep L and h and lose chroma (binary search). */
export function oklchToHex([L, C, h]) {
  let lo = 0;
  let hi = C;
  let lin = oklabToLinearRgb(oklchToOklab([L, C, h]));
  if (!inGamut(lin)) {
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklabToLinearRgb(oklchToOklab([L, mid, h])))) lo = mid;
      else hi = mid;
    }
    lin = oklabToLinearRgb(oklchToOklab([L, lo, h]));
  }
  return rgbToHex(lin.map((v) => toGamma(clamp01(v))));
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Composite a hex colour with alpha over an opaque background hex. */
export function over(fgHex, alpha, bgHex) {
  const f = hexToRgb(fgHex);
  const g = hexToRgb(bgHex);
  return rgbToHex(f.map((v, i) => v * alpha + g[i] * (1 - alpha)));
}

/** Euclidean distance in OKLab (a perceptual difference estimate). */
export function deltaOk(a, b) {
  const p = rgbToOklab(hexToRgb(a));
  const q = rgbToOklab(hexToRgb(b));
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

// Colour-vision-deficiency simulation (Machado et al. 2009, severity 1.0), applied in linear RGB.
const CVD = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

export function simulate(hex, type) {
  const lin = hexToRgb(hex).map(toLinear);
  const m = CVD[type];
  const out = m.map((row) => row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]);
  return rgbToHex(out.map((v) => toGamma(clamp01(v))));
}
