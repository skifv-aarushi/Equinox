"""
Background removal for all AVIF frames → PNG with alpha channel.
Uses rembg (U2Net model) for AI-based removal on gradient backgrounds.

Output: client/public/frames-png/frame_XXXX.png  (RGBA, transparent bg)
"""

import os
import sys
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

INPUT_DIR  = Path("client/public/frames")
OUTPUT_DIR = Path("client/public/frames-png")
OUTPUT_DIR.mkdir(exist_ok=True)

frames = sorted(INPUT_DIR.glob("frame_*.avif"))
total  = len(frames)

if total == 0:
    print("No AVIF frames found in", INPUT_DIR)
    sys.exit(1)

print(f"Found {total} frames. Loading U2Net model (first run downloads ~170 MB)...")

# Create a single session so the model is loaded once and reused for all frames
session = new_session("u2net")

print("Processing frames...\n")

for i, src in enumerate(frames, 1):
    dst = OUTPUT_DIR / (src.stem + ".png")

    # Skip already-processed frames so the script is re-runnable
    if dst.exists():
        print(f"  [{i:3d}/{total}] SKIP  {src.name}  (already exists)")
        continue

    try:
        img    = Image.open(src).convert("RGBA")
        result = remove(img, session=session)          # RGBA with transparent bg
        result.save(dst, format="PNG", optimize=False) # lossless alpha
        print(f"  [{i:3d}/{total}] OK    {src.name} -> {dst.name}")
    except Exception as e:
        print(f"  [{i:3d}/{total}] ERROR {src.name}: {e}")

print(f"\nDone. PNGs written to: {OUTPUT_DIR.resolve()}")
