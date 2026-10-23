#!/usr/bin/env python3
"""Outline the Vici wordmarks from Bricolage Grotesque (OFL) into src/brand/wordmarks.json.

Run once whenever the wordmark text or weight changes:
    pip install fonttools brotli uharfbuzz
    python3 scripts/brand/wordmark.py

Dots on i, j and umlauts are swapped for flat-top hexagons of equal visual weight,
so the wordmark follows the same rule as the rest of the system.
"""
import json
import math
import pathlib

import uharfbuzz as hb
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
import io

ROOT = pathlib.Path(__file__).resolve().parents[2]
FONT = ROOT / "assets/fonts/bricolage-grotesque-latin.woff2"
OUT = ROOT / "src/brand/wordmarks.json"

WORDMARKS = {
    "victor-pflueger": {"text": "Victor Pflüger", "wght": 600, "opsz": 96, "tracking": -12},
    "vici": {"text": "Vici", "wght": 650, "opsz": 96, "tracking": -10},
}


def instance(wght, opsz):
    font = TTFont(str(FONT))
    inst = instantiateVariableFont(font, {"wght": wght, "opsz": opsz}, inplace=False)
    buf = io.BytesIO()
    inst.flavor = None
    inst.save(buf)
    return inst, buf.getvalue()


def contours(glyphset, name):
    rec = DecomposingRecordingPen(glyphset)
    glyphset[name].draw(rec)
    out, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ("closePath", "endPath"):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def bounds(contour):
    pts = [p for _, args in contour for p in args if isinstance(p, tuple)]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def hexagon(cx, cy, d):
    """Flat-top hexagon with the visual weight of a dot of diameter d (font units, y up)."""
    h = 0.97 * d
    s = h / math.sqrt(3)
    pts = [(cx + s * math.cos(math.radians(a)), cy + s * math.sin(math.radians(a))) for a in range(0, 360, 60)]
    return [("moveTo", (pts[0],))] + [("lineTo", (p,)) for p in pts[1:]] + [("closePath", ())]


def build(spec):
    font, data = instance(spec["wght"], spec["opsz"])
    upem = font["head"].unitsPerEm
    glyphset = font.getGlyphSet()
    xheight = font["OS/2"].sxHeight
    cap = font["OS/2"].sCapHeight

    face = hb.Face(data)
    hbfont = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(spec["text"])
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": True})
    order = font.getGlyphOrder()

    pen = SVGPathPen(None)
    x = 0
    dots = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        ox, oy = x + pos.x_offset, pos.y_offset
        tpen = TransformPen(pen, (1, 0, 0, -1, ox, -oy))  # flip y: baseline at 0, y grows downwards
        for c in contours(glyphset, name):
            x0, y0, x1, y1 = bounds(c)
            w, h = x1 - x0, y1 - y0
            is_dot = y0 > xheight * 0.92 and w < upem * 0.2 and h < upem * 0.2 and abs(w - h) < 0.35 * max(w, h)
            if is_dot:
                c = hexagon((x0 + x1) / 2, (y0 + y1) / 2, max(w, h))
                dots += 1
            for op, args in c:
                getattr(tpen, op)(*args)
        x += pos.x_advance + spec["tracking"]
    x -= spec["tracking"]

    d = pen.getCommands()
    return {
        "text": spec["text"],
        "weight": spec["wght"],
        "opsz": spec["opsz"],
        "unitsPerEm": upem,
        "capHeight": cap,
        "xHeight": xheight,
        "ascender": font["hhea"].ascent,
        "descender": font["hhea"].descent,
        "advance": x,
        "hexDots": dots,
        "d": d,
    }


def main():
    out = {key: build(spec) for key, spec in WORDMARKS.items()}
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for k, v in out.items():
        print(f"{k}: '{v['text']}' advance={v['advance']} hexDots={v['hexDots']} pathlen={len(v['d'])}")


if __name__ == "__main__":
    main()
