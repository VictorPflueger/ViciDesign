#!/usr/bin/env python3
"""Make the small copy of Victor Pflüger's portrait for bylines and small avatars.

    python3 scripts/brand/portrait.py      (needs Pillow)

assets/brand/portrait.jpg is the original photo and stays untouched. The byline shows the
portrait 24 px high, so a 96 px copy covers screens up to 4x density at a fraction of the
size. The copy is written without any metadata. The portrait is one of Victor's personal
brand assets: all rights reserved (see LICENSE).
"""
import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "assets/brand/portrait.jpg"
SIZES = [96]


def main():
    original = Image.open(SRC).convert("RGB")
    side = min(original.size)
    left = (original.width - side) // 2
    top = (original.height - side) // 2
    square = original.crop((left, top, left + side, top + side))
    for size in SIZES:
        out = ROOT / f"assets/brand/portrait-{size}.jpg"
        square.resize((size, size), Image.LANCZOS).save(out, "JPEG", quality=88, optimize=True, progressive=False)
        print(f"{out.relative_to(ROOT)}: {size} x {size}, {out.stat().st_size} bytes")


if __name__ == "__main__":
    main()
