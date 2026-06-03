#!/usr/bin/env python3
"""
pixel_art.py — Convert any image to pixel art with true transparency.

Background removal uses BFS flood fill from the image borders:
only pixels *connected to the exterior* and within color tolerance
are made transparent — interior pixels with similar colors are safe.

Usage:
  python pixel_art.py <image> [block=10] [colors=16] [tol=30]

Output: <stem>_px<block>.png  (saved next to the source file)
"""
import sys
from pathlib import Path
from collections import deque
from PIL import Image
import numpy as np


# ── Background removal: BFS flood fill from all 4 edges ──────────────────────

def flood_fill_bg(rgba: np.ndarray, tol: int = 30) -> np.ndarray:
    """
    BFS starting from every border pixel.
    A pixel joins the flood if its color is within `tol` (max channel diff)
    of the sampled background color.
    Pixels inside the sprite that share the BG color but are not reachable
    from the outside are left untouched.
    """
    h, w = rgba.shape[:2]

    # Sample image border to estimate background color
    border = np.concatenate([
        rgba[0,  :,  :3].reshape(-1, 3),
        rgba[-1, :,  :3].reshape(-1, 3),
        rgba[:,  0,  :3].reshape(-1, 3),
        rgba[:, -1,  :3].reshape(-1, 3),
    ])
    bg = border.mean(axis=0)   # [R, G, B]

    visited    = np.zeros((h, w), dtype=bool)
    is_bg_mask = np.zeros((h, w), dtype=bool)

    # Seed: all 4 border edges
    q = deque()
    def seed(y, x):
        if not visited[y, x]:
            visited[y, x] = True
            q.append((y, x))

    for x in range(w):
        seed(0,   x)
        seed(h-1, x)
    for y in range(h):
        seed(y, 0)
        seed(y, w-1)

    # BFS
    while q:
        y, x = q.popleft()
        diff = int(np.abs(rgba[y, x, :3].astype(np.int32) - bg).max())
        if diff < tol:
            is_bg_mask[y, x] = True
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    result = rgba.copy()
    result[is_bg_mask, 3] = 0
    return result, bg


# ── Core conversion ───────────────────────────────────────────────────────────

def to_pixel_art(src: str, block: int = 10, n_colors: int = 16, tol: int = 30) -> str:
    p = Path(src)

    img = Image.open(src).convert('RGBA')
    arr = np.array(img, dtype=np.uint8)

    # ── STEP 1: Flood fill background removal (full resolution) ──────────────
    arr, bg = flood_fill_bg(arr, tol=tol)
    print(f"  [1] BG flood-fill  RGB({bg[0]:.0f},{bg[1]:.0f},{bg[2]:.0f})  tol={tol}")

    flood_dst = str(p.with_name(f"{p.stem}_flood.png"))
    Image.fromarray(arr, 'RGBA').save(flood_dst)
    print(f"      Saved: {flood_dst}")

    # ── STEP 2: Pixelization ──────────────────────────────────────────────────
    img = Image.fromarray(arr, 'RGBA')
    W, H = img.width, img.height

    sw, sh = max(1, W // block), max(1, H // block)
    small  = img.resize((sw, sh), Image.LANCZOS)
    sa     = np.array(small, dtype=np.uint8)

    # Snap alpha: fully transparent or fully opaque — no in-between
    sa[:, :, 3] = np.where(sa[:, :, 3] >= 128, 255, 0)

    # Scale back to EXACT original dimensions — same canvas size, pixel art look
    out = Image.fromarray(sa, 'RGBA').resize((W, H), Image.NEAREST)

    px_dst = str(p.with_name(f"{p.stem}_px{block}.png"))
    out.save(px_dst)
    print(f"  [2] {sw}x{sh} art-pixels @ {block}px/px  ->  {sw*block}x{sh*block}px  ({n_colors} colors)")
    print(f"      Saved: {px_dst}")
    return px_dst


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    src      = sys.argv[1]
    block    = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    n_colors = int(sys.argv[3]) if len(sys.argv) > 3 else 16
    tol      = int(sys.argv[4]) if len(sys.argv) > 4 else 30

    to_pixel_art(src, block, n_colors, tol)
