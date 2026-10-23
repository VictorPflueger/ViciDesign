#!/usr/bin/env python3
"""Build assets/fonts/vici-mask.woff2: a one-glyph font whose bullet is a flat-top hexagon.

Browsers draw password masks with the bullet character (U+2022) of the field's font, and
Chromium does not let CSS change the mask shape. Listing this font first, limited to the
bullet code points, turns the round dots into hexagons and leaves all other text alone.

    pip install fonttools brotli
    python3 scripts/brand/mask-font.py
"""
import math
import pathlib

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/fonts/vici-mask.woff2"
UPEM = 1000
ADVANCE = 600   # about the width of a bullet with its spacing in Inter
HEIGHT = 330    # hexagon height in font units, centred on the x-height
CENTRE = (300, 300)


def hexagon(cx, cy, h):
    r = h / math.sqrt(3)  # circumradius of a flat-top hexagon of height h
    pts = [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in (0, 300, 240, 180, 120, 60)]
    pen = TTGlyphPen(None)  # clockwise, as TrueType expects
    pen.moveTo(tuple(round(v) for v in pts[0]))
    for p in pts[1:]:
        pen.lineTo(tuple(round(v) for v in p))
    pen.closePath()
    return pen.glyph()


def main():
    fb = FontBuilder(UPEM, isTTF=True)
    fb.setupGlyphOrder([".notdef", "bullet"])
    fb.setupCharacterMap({0x2022: "bullet", 0x2219: "bullet", 0x25CF: "bullet"})
    fb.setupGlyf({".notdef": TTGlyphPen(None).glyph(), "bullet": hexagon(*CENTRE, HEIGHT)})
    lsb = round(CENTRE[0] - HEIGHT / math.sqrt(3))
    fb.setupHorizontalMetrics({".notdef": (ADVANCE, 0), "bullet": (ADVANCE, lsb)})
    fb.setupHorizontalHeader(ascent=900, descent=-250)
    fb.setupNameTable({"familyName": "Vici Mask", "styleName": "Regular", "copyright": "Vici Design System"})
    fb.setupOS2(sTypoAscender=900, sTypoDescender=-250, usWinAscent=900, usWinDescent=250)
    fb.setupPost()
    fb.font.flavor = "woff2"
    fb.save(str(OUT))
    print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
