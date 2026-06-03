#!/usr/bin/env python3
"""
process_sprites.py — Batch pixel-art conversion for all sprites.

For each PNG in the sprites folder:
  - If no alpha: flood-fill removes the solid background first
  - Then pixelizes at BLOCK x BLOCK pixels per art-pixel
  - Overwrites the original file in place

Usage:
  python process_sprites.py [block=10] [colors=16] [tol=30]
"""
import sys
import os
from pathlib import Path
from collections import deque
from PIL import Image
import numpy as np

SPRITES_DIR = Path(r'C:\APP\math-game\public\sprites')
BLOCK    = int(sys.argv[1]) if len(sys.argv) > 1 else 10
N_COLORS = int(sys.argv[2]) if len(sys.argv) > 2 else 16
TOL      = int(sys.argv[3]) if len(sys.argv) > 3 else 30

SKIP_SUFFIXES = ('_backup', '_flood', '_px')


# ── Background removal via BFS flood fill ─────────────────────────────────────

def flood_fill_bg(rgba: np.ndarray, tol: int) -> np.ndarray:
    h, w = rgba.shape[:2]
    border = np.concatenate([
        rgba[0,  :,  :3].reshape(-1, 3),
        rgba[-1, :,  :3].reshape(-1, 3),
        rgba[:,  0,  :3].reshape(-1, 3),
        rgba[:, -1,  :3].reshape(-1, 3),
    ])
    bg = border.mean(axis=0)

    visited    = np.zeros((h, w), dtype=bool)
    is_bg_mask = np.zeros((h, w), dtype=bool)

    q = deque()
    def seed(y, x):
        if not visited[y, x]:
            visited[y, x] = True
            q.append((y, x))

    for x in range(w):  seed(0, x);   seed(h-1, x)
    for y in range(h):  seed(y, 0);   seed(y, w-1)

    while q:
        y, x = q.popleft()
        diff = int(np.abs(rgba[y, x, :3].astype(np.int32) - bg).max())
        if diff < tol:
            is_bg_mask[y, x] = True
            for dy, dx in ((-1,0),(1,0),(0,-1),(0,1)):
                ny, nx = y+dy, x+dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    result = rgba.copy()
    result[is_bg_mask, 3] = 0
    return result, bg


# ── Pixel-art conversion ──────────────────────────────────────────────────────

def process(path: Path):
    img = Image.open(path).convert('RGBA')
    arr = np.array(img, dtype=np.uint8)

    already_transparent = (arr[:, :, 3] < 255).any()

    if already_transparent:
        tag = 'skip flood (has alpha)'
    else:
        arr, bg = flood_fill_bg(arr, tol=TOL)
        tag = f'flood RGB({bg[0]:.0f},{bg[1]:.0f},{bg[2]:.0f})'

    img = Image.fromarray(arr, 'RGBA')
    W, H = img.width, img.height

    sw, sh = max(1, W // BLOCK), max(1, H // BLOCK)
    small  = img.resize((sw, sh), Image.LANCZOS)
    sa     = np.array(small, dtype=np.uint8)

    # Snap alpha: fully transparent or fully opaque — no in-between
    sa[:, :, 3] = np.where(sa[:, :, 3] >= 128, 255, 0)

    # No color quantization — LANCZOS averaging already gives clean per-block
    # colors; quantizing to a small palette destroys vibrant multi-color sprites.

    # Scale back to EXACT original dimensions — pixel art look, same canvas size
    out = Image.fromarray(sa, 'RGBA').resize((W, H), Image.NEAREST)
    out.save(str(path))

    print(f'  {path.name:35s} {W}x{H} (unchanged)  [{tag}]')


# ── Main ──────────────────────────────────────────────────────────────────────

files = sorted(
    p for p in SPRITES_DIR.glob('*.png')
    if not any(s in p.stem for s in SKIP_SUFFIXES)
)

print(f'Processing {len(files)} sprites  (block={BLOCK}, colors={N_COLORS}, tol={TOL})\n')
for f in files:
    process(f)
print('\nDone.')
