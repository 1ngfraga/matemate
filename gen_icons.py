"""Generate all Android launcher icons from reference/logo.png"""
from PIL import Image, ImageDraw
import os

SRC  = "reference/logo.png"
BASE = "android/app/src/main/res"

# (folder, ic_launcher size, ic_launcher_foreground size)
DENSITIES = [
    ("mipmap-mdpi",    48,  108),
    ("mipmap-hdpi",    72,  162),
    ("mipmap-xhdpi",   96,  216),
    ("mipmap-xxhdpi",  144, 324),
    ("mipmap-xxxhdpi", 192, 432),
]

def make_circle_mask(size):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
    return mask

def make_launcher(logo, size):
    """Square icon resized from logo."""
    return logo.resize((size, size), Image.LANCZOS)

def make_round(logo, size):
    """Circular crop of the logo."""
    sq = logo.resize((size, size), Image.LANCZOS).convert("RGBA")
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(sq, mask=make_circle_mask(size))
    return out

def make_foreground(logo, fg_size):
    """
    Adaptive-icon foreground layer — full bleed.
    The logo fills the entire canvas so no background color peeks through
    at any launcher shape (circle, squircle, square, etc.).
    """
    return logo.resize((fg_size, fg_size), Image.LANCZOS).convert("RGBA")

def main():
    logo_src = Image.open(SRC).convert("RGBA")

    for folder, sq_size, fg_size in DENSITIES:
        path = os.path.join(BASE, folder)
        os.makedirs(path, exist_ok=True)

        make_launcher(logo_src, sq_size).save(
            os.path.join(path, "ic_launcher.png"), optimize=True)

        make_round(logo_src, sq_size).save(
            os.path.join(path, "ic_launcher_round.png"), optimize=True)

        make_foreground(logo_src, fg_size).save(
            os.path.join(path, "ic_launcher_foreground.png"), optimize=True)

        print(f"  {folder}: {sq_size}px launcher + {fg_size}px foreground")

    print("\nAll icons generated.")

if __name__ == "__main__":
    main()
