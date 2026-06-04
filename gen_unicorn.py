"""Generate unicorn sprites for math-game (pixel art, transparent PNG)."""
from PIL import Image, ImageDraw
import os

OUT = "public/sprites"

# ─── Palette ──────────────────────────────────────────────────────────────────
TRANS   = (0,   0,   0,   0)
BDY     = (245, 238, 225, 255)   # cream body
BDY_HI  = (255, 250, 242, 255)   # highlight
BDY_SH  = (208, 196, 176, 255)   # shadow
LINE    = ( 72,  50,  32, 255)   # outline / dark brown
PINK    = (255, 145, 190, 255)   # mane pink
PURP    = (185, 120, 252, 255)   # mane purple
BLUE    = (110, 190, 255, 255)   # mane blue
GOLD    = (255, 215,  30, 255)   # horn gold
GOLDD   = (198, 155,   0, 255)   # horn shadow
EYE     = ( 38,  22,  12, 255)   # eye dark
IRIS    = ( 75, 140, 230, 255)   # eye iris blue
SHINE   = (255, 255, 255, 255)   # eye shine
SKIN    = (255, 215, 202, 255)   # snout / inner ear
HOOF    = (102,  76,  52, 255)   # hooves
TEAR    = (170, 215, 255, 180)   # teardrop (face sad)
BLUSH   = (255, 175, 165, 100)   # rosy cheek

# ─── Helpers ──────────────────────────────────────────────────────────────────
def ellipse(d, cx, cy, rx, ry, fill, outline=None, ow=1):
    d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=fill,
              outline=outline, width=ow)

def poly(d, pts, fill, outline=None):
    d.polygon(pts, fill=fill, outline=outline)

def line(d, pts, fill, w=1):
    d.line(pts, fill=fill, width=w)

def dot(d, x, y, r, fill, outline=None):
    ellipse(d, x, y, r, r, fill, outline)

# ─── Body drawing helpers ─────────────────────────────────────────────────────
def draw_horn(d, hx, hy):
    """Draw a spiraled golden horn above forehead."""
    # Base: slightly wider triangle
    pts = [(hx-3, hy), (hx+2, hy), (hx+5, hy-8), (hx+2, hy-15), (hx-2, hy-15)]
    poly(d, pts, GOLD, LINE)
    # Shade stripe on left
    line(d, [(hx-1, hy-1), (hx+1, hy-11)], GOLDD, 1)
    # Spiral rings
    for yy, xl, xr in [(hy-4, hx-2, hx+3), (hy-8, hx-1, hx+4), (hy-12, hx, hx+3)]:
        line(d, [(xl, yy), (xr, yy)], GOLDD, 1)

def draw_mane(d, pts_list, colors):
    """Draw layered mane strands."""
    for pts, col in zip(pts_list, colors):
        for i in range(len(pts)-1):
            line(d, [pts[i], pts[i+1]], col, 3)

def draw_eye(d, cx, cy, happy=False, sad=False):
    """Draw a detailed pixel-art eye."""
    if happy:
        # Wide sparkly eye
        ellipse(d, cx, cy, 4, 4, EYE, LINE)
        ellipse(d, cx-1, cy, 3, 3, IRIS)
        dot(d, cx-1, cy-1, 2, EYE)
        dot(d, cx-2, cy-2, 1, SHINE)
        dot(d, cx+1, cy+1, 1, SHINE)
    elif sad:
        # Droopy eye, slightly squinted
        ellipse(d, cx, cy+1, 3, 3, EYE, LINE)
        ellipse(d, cx-1, cy+1, 2, 2, IRIS)
        dot(d, cx-1, cy, 1, EYE)
        dot(d, cx-2, cy-1, 1, SHINE)
        # Sad eyebrow tilted inward
        line(d, [(cx-3, cy-3), (cx+3, cy-5)], LINE, 1)
    else:
        # Normal attentive eye
        ellipse(d, cx, cy, 3, 3, EYE, LINE)
        ellipse(d, cx-1, cy, 2, 2, IRIS)
        dot(d, cx-1, cy-1, 1, EYE)
        dot(d, cx-2, cy-2, 1, SHINE)

def draw_leg(d, x1, y1, x2, y2, horiz_hoof=0):
    """Draw a leg + hoof from (x1,y1) to (x2,y2)."""
    line(d, [(x1, y1), (x2, y2)], LINE, 5)
    line(d, [(x1, y1), (x2, y2)], BDY, 3)
    # Hoof: small rounded rectangle
    hx, hy = x2 + horiz_hoof, y2
    d.rounded_rectangle([hx-4, hy-1, hx+4, hy+5], radius=2, fill=HOOF, outline=LINE)

def draw_tail(d, base_x, base_y, wave=0):
    """Draw a flowing colorful tail."""
    pts = [
        (base_x,      base_y),
        (base_x-6,    base_y - 4 + wave),
        (base_x-12,   base_y + 3),
        (base_x-14,   base_y + 11),
        (base_x-10,   base_y + 18),
    ]
    for i in range(len(pts)-1):
        col = [PINK, PURP, BLUE, PINK][i]
        line(d, [pts[i], pts[i+1]], col, 4)
    # Tail tip tuft
    dot(d, pts[-1][0], pts[-1][1], 3, BLUE)
    dot(d, pts[-1][0]-2, pts[-1][1]+1, 2, PURP)

# ─── RUN FRAMES ───────────────────────────────────────────────────────────────
#   Frame layout: character faces RIGHT, head at x≈72-88, body at x≈30-70
#   Body center: bx=50, by=62
#   Head center:  hx=76, hy=44

def run_frame(d, v):
    """
    Draw unicorn running.  v in {0,1,2}
    v=0  right-front + left-back forward
    v=1  neutral mid-stride (body slightly lower)
    v=2  left-front + right-back forward  (mirror of v=0)
    """
    bx, by = 50, 62
    hx, hy = 76, 44

    body_drop = 2 if v == 1 else 0
    by += body_drop

    # ── Tail ──
    draw_tail(d, bx-20, by-4, wave=(-3 if v==0 else (3 if v==2 else 0)))

    # ── Body ──
    ellipse(d, bx, by, 24, 14, BDY, LINE, 2)
    # belly shadow
    ellipse(d, bx+2, by+6, 18, 7, BDY_SH)
    # back highlight
    ellipse(d, bx-2, by-6, 14, 5, BDY_HI)

    # ── Neck ──
    poly(d, [(bx+18, by-10), (bx+22, by-22), (bx+30, by-18), (bx+26, by-5)], BDY, LINE)

    # ── Head ──
    ellipse(d, hx, hy, 13, 12, BDY, LINE, 2)
    # Snout bump
    ellipse(d, hx+8, hy+3, 7, 6, SKIN, LINE)
    # Inner ear colour
    ellipse(d, hx-6, hy-9, 3, 4, PINK)

    # ── Horn ──
    draw_horn(d, hx-2, hy-10)

    # ── Mane ──
    mane_pts = [
        [(hx-4, hy-8), (hx-8, hy-1), (hx-10, by-22), (hx-14, by-12), (hx-12, by-2)],
        [(hx-6, hy-6), (hx-10, hy+1), (hx-12, by-20), (hx-16, by-10)],
        [(hx-8, hy-4), (hx-12, hy+3), (hx-14, by-18), (hx-17, by-7)],
    ]
    draw_mane(d, mane_pts, [PINK, PURP, BLUE])
    # Forelock tuft on forehead
    dot(d, hx-3, hy-11, 3, PINK)
    dot(d, hx-5, hy-11, 3, PURP)
    dot(d, hx-7, hy-11, 2, BLUE)

    # ── Eye ──
    draw_eye(d, hx+4, hy-2)

    # ── Nostril ──
    dot(d, hx+13, hy+5, 2, (195, 145, 130, 255))

    # ── Legs ──
    #  Front pair at x≈60-68, back pair at x≈34-42
    #  y origin from belly bottom ≈ by+12
    LY = by + 12

    if v == 0:
        # front-right forward, front-left back/raised
        draw_leg(d, 66, LY, 72, LY+14)
        draw_leg(d, 60, LY, 54, LY+9)
        # back-right back, back-left forward
        draw_leg(d, 40, LY, 36, LY+14)
        draw_leg(d, 34, LY, 40, LY+9)
    elif v == 1:
        # all legs roughly down (contact phase)
        draw_leg(d, 66, LY, 66, LY+15)
        draw_leg(d, 60, LY, 58, LY+15)
        draw_leg(d, 40, LY, 40, LY+15)
        draw_leg(d, 34, LY, 32, LY+15)
    else:
        # opposite of v=0
        draw_leg(d, 66, LY, 60, LY+9)
        draw_leg(d, 60, LY, 66, LY+14)
        draw_leg(d, 40, LY, 44, LY+9)
        draw_leg(d, 34, LY, 36, LY+14)

def make_run_sheet():
    sheet = Image.new('RGBA', (300, 100), TRANS)
    for v in range(3):
        img = Image.new('RGBA', (100, 100), TRANS)
        run_frame(ImageDraw.Draw(img), v)
        sheet.paste(img, (v*100, 0))
    sheet.save(f"{OUT}/unicorn.png")
    print("✓ unicorn.png (300×100)")

# ─── VICTORY FRAMES ───────────────────────────────────────────────────────────
def victory_frame(d, v):
    """
    Draw unicorn celebrating.
    v=0  slight hop, arms starting to rise
    v=1  peak jump – highest, arms up, big smile
    v=2  landing, arms coming down
    """
    heights = [4, 14, 6]        # how many px the body is raised
    arm_raise = [8, 22, 10]     # how high the front legs are raised

    lift = heights[v]
    arm = arm_raise[v]

    bx, by = 50, 66 - lift
    hx, hy = 72, by - 22

    # ── Tail ──
    draw_tail(d, bx-20, by-2, wave=(6 if v==1 else 2))

    # ── Body (upright) ──
    ellipse(d, bx, by, 20, 16, BDY, LINE, 2)
    ellipse(d, bx+1, by+7, 15, 7, BDY_SH)
    ellipse(d, bx-2, by-7, 12, 5, BDY_HI)

    # ── Neck ──
    poly(d, [(bx+12, by-14), (bx+14, by-27), (bx+22, by-24), (bx+20, by-10)], BDY, LINE)

    # ── Head ──
    ellipse(d, hx, hy, 13, 12, BDY, LINE, 2)
    ellipse(d, hx+8, hy+3, 7, 6, SKIN, LINE)
    ellipse(d, hx-6, hy-9, 3, 4, PINK)

    # ── Horn ──
    draw_horn(d, hx-2, hy-10)

    # ── Mane ──
    mane_pts = [
        [(hx-4, hy-8), (hx-8, hy-2), (hx-11, by-20), (hx-13, by-10)],
        [(hx-6, hy-6), (hx-10, hy), (hx-13, by-18)],
        [(hx-8, hy-4), (hx-12, hy+2), (hx-14, by-16)],
    ]
    draw_mane(d, mane_pts, [PINK, PURP, BLUE])
    dot(d, hx-3, hy-11, 3, PINK)
    dot(d, hx-5, hy-11, 3, PURP)
    dot(d, hx-7, hy-11, 2, BLUE)

    # ── Eye (always happy in victory) ──
    draw_eye(d, hx+4, hy-2, happy=True)

    # ── Big smile ──
    d.arc([hx+2, hy+4, hx+14, hy+11], start=180, end=0,
          fill=(155, 80, 65, 255), width=2)

    # ── Nostril ──
    dot(d, hx+13, hy+5, 2, (195, 145, 130, 255))

    # ── Front legs (raised / celebrating) ──
    # front-right: raised high
    line(d, [(bx+14, by+8), (bx+18, by+2), (bx+22, by-arm)], LINE, 5)
    line(d, [(bx+14, by+8), (bx+18, by+2), (bx+22, by-arm)], BDY, 3)
    d.rounded_rectangle([bx+18, by-arm-1, bx+26, by-arm+5], radius=2, fill=HOOF, outline=LINE)

    # front-left: raised less
    line(d, [(bx+8, by+10), (bx+4, by+4), (bx-1, by-arm//2)], LINE, 5)
    line(d, [(bx+8, by+10), (bx+4, by+4), (bx-1, by-arm//2)], BDY, 3)
    d.rounded_rectangle([bx-5, by-arm//2-1, bx+3, by-arm//2+5], radius=2, fill=HOOF, outline=LINE)

    # ── Back legs (down) ──
    LY = by + 14
    draw_leg(d, bx-10, LY, bx-8, LY+12)
    draw_leg(d, bx-16, LY, bx-18, LY+12)

    # ── Sparkles ──
    sparkles = [(12, 20), (88, 22), (8, 55), (90, 50)]
    if v == 1:
        sparkles += [(48, 8), (72, 72)]
    for sx, sy in sparkles:
        line(d, [(sx-4, sy), (sx+4, sy)], (255, 230, 50, 200), 2)
        line(d, [(sx, sy-4), (sx, sy+4)], (255, 230, 50, 200), 2)
        line(d, [(sx-3, sy-3), (sx+3, sy+3)], (255, 230, 50, 130), 1)
        line(d, [(sx-3, sy+3), (sx+3, sy-3)], (255, 230, 50, 130), 1)

def make_victory_sheet():
    sheet = Image.new('RGBA', (300, 100), TRANS)
    for v in range(3):
        img = Image.new('RGBA', (100, 100), TRANS)
        victory_frame(ImageDraw.Draw(img), v)
        sheet.paste(img, (v*100, 0))
    sheet.save(f"{OUT}/unicorn_victory.png")
    print("✓ unicorn_victory.png (300×100)")

# ─── FACE SHEET ───────────────────────────────────────────────────────────────
def face_frame(d, v):
    """
    Draw a 40×40 close-up face portrait.
    v=0  concentrated (focused brow, neutral mouth)
    v=1  success (big happy eyes, wide smile, blush)
    v=2  fail (sad droopy eyes, frown, tear)
    """
    cx, cy = 20, 22

    happy = (v == 1)
    sad   = (v == 2)

    # ── Head ──
    ellipse(d, cx, cy, 15, 14, BDY, LINE, 2)
    # Snout
    ellipse(d, cx+8, cy+4, 8, 6, SKIN, LINE)
    # Inner ear
    ellipse(d, cx-9, cy-9, 3, 4, PINK)
    ellipse(d, cx-9, cy-9, 2, 3, (255, 200, 220, 255))

    # ── Horn ──
    draw_horn(d, cx-2, cy-12)

    # ── Mane tuft ──
    dot(d, cx-7, cy-14, 4, PINK)
    dot(d, cx-4, cy-16, 4, PURP)
    dot(d, cx,   cy-17, 3, BLUE)

    # ── Eyes ──
    if happy:
        draw_eye(d, cx-5, cy-3, happy=True)
        draw_eye(d, cx+3, cy-3, happy=True)
        # Blush
        ellipse(d, cx-7, cy+3, 4, 3, BLUSH)
        ellipse(d, cx+5, cy+3, 4, 3, BLUSH)
    elif sad:
        draw_eye(d, cx-5, cy-2, sad=True)
        draw_eye(d, cx+3, cy-2, sad=True)
        # Tears
        dot(d, cx-4, cy+3, 2, TEAR)
        dot(d, cx+4, cy+3, 2, TEAR)
    else:
        # Concentrated: normal eyes, slight furrowed brow
        draw_eye(d, cx-5, cy-3)
        draw_eye(d, cx+3, cy-3)
        # Brow lines (intense look)
        line(d, [(cx-8, cy-7), (cx-2, cy-8)], LINE, 1)
        line(d, [(cx+1, cy-8), (cx+7, cy-7)], LINE, 1)

    # ── Mouth ──
    if happy:
        d.arc([cx+1, cy+5, cx+13, cy+11], start=180, end=0,
              fill=(155, 80, 65, 255), width=2)
    elif sad:
        d.arc([cx+1, cy+7, cx+13, cy+13], start=0, end=180,
              fill=(155, 80, 65, 255), width=2)
    else:
        # Small neutral / slightly tense line
        line(d, [(cx+4, cy+7), (cx+10, cy+7)], (155, 80, 65, 255), 1)

    # ── Nostril ──
    dot(d, cx+13, cy+5, 2, (195, 145, 130, 255))

def make_face_sheet():
    sheet = Image.new('RGBA', (120, 40), TRANS)
    for v in range(3):
        img = Image.new('RGBA', (40, 40), TRANS)
        face_frame(ImageDraw.Draw(img), v)
        sheet.paste(img, (v*40, 0))
    sheet.save(f"{OUT}/unicorn_face.png")
    print("✓ unicorn_face.png (120×40)")

# ─── Run everything ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    make_run_sheet()
    make_victory_sheet()
    make_face_sheet()
    print("\nAll unicorn sprites ready in", OUT)
