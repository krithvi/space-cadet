"""
Make a web-safe preview of a poster: smaller, watermarked, metadata stripped.

    pip install pillow pymupdf
    python tools/make_poster_preview.py posters-src/my-poster.pdf assets/posters/my-poster.webp

Accepts a PDF (first page) or an image. Keep the originals in posters-src/, which is
git-ignored, so the full-resolution file never reaches the public repo.
"""
import sys, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

MAX_WIDTH = 1400          # wide enough to read headings on a laptop, too small to reprint
QUALITY = 70              # WebP quality
MARK = "© Kavya Rajendran · krithvi.space · preview only"
OPACITY = 38              # 0–255; raise if the mark is too easy to ignore

def load(src: Path) -> Image.Image:
    if src.suffix.lower() == ".pdf":
        import pymupdf
        page = pymupdf.open(src)[0]
        pix = page.get_pixmap(dpi=150)
        return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    return Image.open(src).convert("RGB")

def font(size):
    for name in ("DejaVuSans-Bold.ttf", "Arial Bold.ttf", "Arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()

def watermark(img: Image.Image) -> Image.Image:
    w, h = img.size
    size = max(18, w // 40)
    f = font(size)
    # Draw the mark tiled on a large transparent sheet, rotate it, crop back to size.
    diag = int(math.hypot(w, h))
    sheet = Image.new("RGBA", (diag * 2, diag * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(sheet)
    step_x = int(d.textlength(MARK, font=f)) + size * 3
    step_y = size * 5
    for row, y in enumerate(range(0, sheet.height, step_y)):
        offset = (row % 2) * step_x // 2
        for x in range(-step_x, sheet.width, step_x):
            d.text((x + offset, y), MARK, font=f, fill=(255, 255, 255, OPACITY))
            d.text((x + offset + 1, y + 1), MARK, font=f, fill=(0, 0, 0, OPACITY))
    sheet = sheet.rotate(30, resample=Image.BICUBIC)
    left, top = (sheet.width - w) // 2, (sheet.height - h) // 2
    sheet = sheet.crop((left, top, left + w, top + h))
    out = img.convert("RGBA")
    out.alpha_composite(sheet)
    return out.convert("RGB")

def main(src, dst):
    src, dst = Path(src), Path(dst)
    img = load(src)
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    img = watermark(img)
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "WEBP", quality=QUALITY, method=6)   # a fresh save carries no EXIF or PDF metadata
    print(f"wrote {dst} ({img.width}×{img.height}, {dst.stat().st_size // 1024} KB)")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(*sys.argv[1:])
