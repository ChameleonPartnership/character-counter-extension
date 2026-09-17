from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "icons"
SIZES = (16, 32, 48, 128)
BG = "#34348C"
WHITE = "#FFFFFF"


def load_font(size):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def make_icon(size):
    scale = 4
    canvas = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    radius = int(size * scale * 0.22)
    inset = max(1, int(size * scale * 0.04))
    draw.rounded_rectangle(
        (inset, inset, size * scale - inset, size * scale - inset),
        radius=radius,
        fill=BG,
    )

    font = load_font(int(size * scale * 0.72))
    text = "C"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size * scale - text_width) / 2 - bbox[0]
    y = (size * scale - text_height) / 2 - bbox[1] - size * scale * 0.02
    draw.text((x, y), text, font=font, fill=WHITE)

    if size >= 32:
        mark_width = max(6, int(size * scale * 0.34))
        mark_height = max(2, int(size * scale * 0.055))
        y_base = int(size * scale * 0.74)
        x_base = int((size * scale - mark_width) / 2)
        for offset in (0, int(size * scale * 0.09)):
            draw.rounded_rectangle(
                (x_base, y_base + offset, x_base + mark_width, y_base + offset + mark_height),
                radius=mark_height // 2,
                fill=WHITE,
            )

    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def main():
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        path = ICON_DIR / f"icon{size}.png"
        make_icon(size).save(path, "PNG")
        print(f"{path.relative_to(ROOT)} {path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
