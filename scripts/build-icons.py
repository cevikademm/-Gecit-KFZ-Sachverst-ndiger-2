"""
logo.pdf -> public/ altinda favicon, PWA ve header logosu PNG'leri uretir.
Calistirma: python scripts/build-icons.py
"""
import os
import sys
import fitz
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_PDF = os.path.join(ROOT, "logo.pdf")
PUBLIC = os.path.join(ROOT, "public")

if not os.path.exists(SRC_PDF):
    print(f"HATA: {SRC_PDF} bulunamadi", file=sys.stderr)
    sys.exit(1)

os.makedirs(PUBLIC, exist_ok=True)

doc = fitz.open(SRC_PDF)
page = doc[0]
zoom = 6.0
mat = fitz.Matrix(zoom, zoom)
pix = page.get_pixmap(matrix=mat, alpha=True)
master_path = os.path.join(PUBLIC, "logo-master.png")
pix.save(master_path)
print(f"master uretildi: {pix.width}x{pix.height}")

master = Image.open(master_path).convert("RGBA")

bbox = master.getbbox()
trimmed = master.crop(bbox) if bbox else master
print(f"trimmed: {trimmed.size}")

def header_logo(img, height):
    ratio = height / img.height
    new_w = int(img.width * ratio)
    return img.resize((new_w, height), Image.LANCZOS)

header = header_logo(trimmed, 320)
header.save(os.path.join(PUBLIC, "logocustom3.png"), optimize=True)
header.save(os.path.join(PUBLIC, "logo-gecit.png"), optimize=True)
header.save(os.path.join(PUBLIC, "logo-header.png"), optimize=True)
print(f"header logo: {header.size}")

def make_square(img, size, pad_ratio=0.08, bg=(255, 255, 255, 255)):
    inner = int(size * (1 - pad_ratio * 2))
    w, h = img.size
    if w >= h:
        new_w = inner
        new_h = max(1, int(inner * h / w))
    else:
        new_h = inner
        new_w = max(1, int(inner * w / h))
    scaled = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), bg)
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    canvas.paste(scaled, (x, y), scaled)
    return canvas

for sz, name in [
    (192, "icon-192.png"),
    (512, "icon-512.png"),
    (180, "apple-touch-icon.png"),
    (192, "icon-192-maskable.png"),
    (512, "icon-512-maskable.png"),
]:
    pad = 0.18 if "maskable" in name else 0.08
    img = make_square(trimmed, sz, pad_ratio=pad)
    img.save(os.path.join(PUBLIC, name), optimize=True)
    print(f"{name}: {sz}x{sz} (pad={pad})")

ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
ico_master = make_square(trimmed, 256, pad_ratio=0.08)
ico_master.save(
    os.path.join(PUBLIC, "favicon.ico"),
    format="ICO",
    sizes=ico_sizes,
)
print("favicon.ico (cok-boyut)")

doc.close()
print("\nTAMAM. Public altinda yeni logo dosyalari hazir.")
