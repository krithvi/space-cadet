"""
Resize and compress an image for the site, so pages stay fast.

    pip install pillow
    python tools/prep_image.py photo.jpg assets/img/write-draw-move/setup.jpg            # body image, 1600px wide
    python tools/prep_image.py photo.jpg assets/img/write-draw-move/thumb.jpg --card     # card image, cropped to 16:10
    python tools/prep_image.py me.jpg assets/img/kavya.jpg --square                       # portrait or favicon, cropped square

Strips location and camera metadata too.
"""
import sys
from pathlib import Path
from PIL import Image, ImageOps

def crop_to(img, ratio):                     # ratio = width / height
    w, h = img.size
    if w / h > ratio:
        nw = round(h * ratio); left = (w - nw) // 2
        return img.crop((left, 0, left + nw, h))
    nh = round(w / ratio); top = (h - nh) // 2
    return img.crop((0, top, w, top + nh))

def main(src, dst, mode):
    img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    if mode == "--card":
        img, width = crop_to(img, 16 / 10), 1200
    elif mode == "--square":
        img, width = crop_to(img, 1), 800
    else:
        width = 1600
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    dst = Path(dst); dst.parent.mkdir(parents=True, exist_ok=True)
    fmt = "WEBP" if dst.suffix.lower() == ".webp" else ("PNG" if dst.suffix.lower() == ".png" else "JPEG")
    opts = {"quality": 82, "optimize": True} if fmt != "PNG" else {"optimize": True}
    if fmt == "JPEG": opts["progressive"] = True
    img.save(dst, fmt, **opts)
    print(f"wrote {dst} ({img.width}×{img.height}, {dst.stat().st_size // 1024} KB)")

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    if len(args) != 2:
        sys.exit(__doc__)
    main(args[0], args[1], flags[0] if flags else "")
