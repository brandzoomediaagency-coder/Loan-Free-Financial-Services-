#!/usr/bin/env python3
"""Responsive photo variants for the site.

Source photos live in src/photos/<name>.jpg (not deployed). This writes
assets/photos/<name>-<w>.avif and .webp for widths 480, 800 and 1200, plus
assets/photos/manifest.json with each photo's intrinsic aspect ratio, which the
build uses for width/height attributes. Pages place a photo with the marker
<!-- lf:photo name="..." alt="..." sizes="..." [eager] -->.

Requires Pillow 11.3+ (AVIF support).  Run: python3 tools/photos.py
"""
import json, os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'src', 'photos')
OUT = os.path.join(ROOT, 'assets', 'photos')
WIDTHS = [480, 800, 1200]
os.makedirs(OUT, exist_ok=True)
manifest = {}
for fn in sorted(os.listdir(SRC)):
    if not fn.lower().endswith(('.jpg', '.jpeg', '.png')):
        continue
    name = os.path.splitext(fn)[0]
    im = Image.open(os.path.join(SRC, fn)).convert('RGB')
    W, H = im.size
    manifest[name] = {'w': W, 'h': H, 'widths': [w for w in WIDTHS if w <= W]}
    for w in manifest[name]['widths']:
        h = round(H * w / W)
        v = im.resize((w, h), Image.LANCZOS)
        v.save(os.path.join(OUT, f'{name}-{w}.webp'), 'WEBP', quality=74, method=6)
        v.save(os.path.join(OUT, f'{name}-{w}.avif'), 'AVIF', quality=52)
    print(name, (W, H), ' '.join(f"{w}:{os.path.getsize(os.path.join(OUT, f'{name}-{w}.avif'))//1024}k/{os.path.getsize(os.path.join(OUT, f'{name}-{w}.webp'))//1024}k" for w in manifest[name]['widths']))
with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
    json.dump(manifest, f, indent=1)
