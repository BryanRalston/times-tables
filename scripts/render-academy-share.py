"""Build the Squishee Academy share image and favicon set from vinyl portraits.

Reads public/squishees/*.png. Writes academy/public assets used by the domain build.
"""

from __future__ import annotations

import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PORTRAITS = ROOT / "public" / "squishees"
OUT = ROOT / "academy" / "public"
FONT_DIR = Path("/tmp/fonts")
SHARE = (1200, 630)

PINK = (255, 75, 147)
TEAL = (18, 152, 138)
INK = (60, 36, 72)
MUTED = (92, 69, 102)
CREAM = (255, 250, 246)


def font(path: Path, size: int, style: str) -> ImageFont.FreeTypeFont:
    face = ImageFont.truetype(str(path), size)
    face.set_variation_by_name(style)
    return face


def ensure_fonts() -> tuple[Path, Path]:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    files = {
        "Fredoka.ttf": "https://github.com/google/fonts/raw/main/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf",
        "Nunito.ttf": "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito%5Bwght%5D.ttf",
    }
    paths = []
    for name, url in files.items():
        dest = FONT_DIR / name
        if not dest.exists() or dest.stat().st_size < 1000:
            urllib.request.urlretrieve(url, dest)
        paths.append(dest)
    return paths[0], paths[1]


def trim(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    box = rgba.getchannel("A").getbbox()
    if not box:
        return rgba
    return rgba.crop(box)


def gradient(size: tuple[int, int]) -> Image.Image:
    width, height = size
    strip = Image.new("RGB", (512, 1))
    pix = strip.load()
    stops = [
        (0.0, (255, 94, 168)),
        (0.42, (255, 75, 147)),
        (0.72, (196, 92, 255)),
        (1.0, (124, 58, 237)),
    ]
    for x in range(512):
        t = x / 511
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]
            t1, c1 = stops[i + 1]
            if t <= t1 or i == len(stops) - 2:
                span = max(1e-6, t1 - t0)
                k = min(1.0, max(0.0, (t - t0) / span))
                pix[x, 0] = tuple(int(a + (b - a) * k) for a, b in zip(c0, c1))
                break
    horiz = strip.resize(size, Image.Resampling.BICUBIC)
    vert = Image.new("RGB", (1, 256))
    vp = vert.load()
    for y in range(256):
        k = y / 255
        light = tuple(int(255 - (255 - c) * (0.55 + 0.45 * k)) for c in (255, 214, 236))
        deep = (92, 36, 168)
        vp[0, y] = tuple(int(a + (b - a) * k) for a, b in zip(light, deep))
    return Image.blend(horiz, vert.resize(size, Image.Resampling.BICUBIC), 0.22)


def blobs(base: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    spots = [
        ((-80, -120, 420, 380), (255, 255, 255, 46)),
        ((860, -160, 1320, 300), (255, 214, 102, 38)),
        ((980, 380, 1280, 720), (255, 255, 255, 28)),
        ((-120, 420, 280, 760), (18, 214, 186, 42)),
        ((520, 80, 760, 320), (255, 255, 255, 24)),
    ]
    for box, color in spots:
        draw.ellipse(box, fill=color)
    overlay = overlay.filter(ImageFilter.GaussianBlur(18))
    out = base.convert("RGBA")
    return Image.alpha_composite(out, overlay)


def text_size(face: ImageFont.FreeTypeFont, text: str) -> tuple[int, int]:
    box = face.getbbox(text)
    return box[2] - box[0], box[3] - box[1]


def draw_text(
    image: Image.Image,
    text: str,
    xy: tuple[int, int],
    face: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
) -> None:
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    x, y = xy
    draw.text((x, y + 4), text, font=face, fill=(90, 24, 72, 50))
    draw.text((x, y), text, font=face, fill=fill + (255,))
    image.alpha_composite(layer)


def fit_row(names: list[str], max_width: int, max_height: int, overlap: int) -> list[Image.Image]:
    trimmed = [trim(Image.open(PORTRAITS / f"{name}.png")) for name in names]
    height = max_height
    while height > 80:
        scaled = []
        for im in trimmed:
            width = max(1, round(im.width * (height / im.height)))
            scaled.append(im.resize((width, height), Image.Resampling.LANCZOS))
        total = sum(im.width for im in scaled) - overlap * (len(scaled) - 1)
        if total <= max_width:
            return scaled
        height -= 4
    return scaled


def shadow_for(im: Image.Image) -> Image.Image:
    alpha = im.getchannel("A")
    shade = Image.new("RGBA", im.size, (70, 18, 64, 0))
    shade.putalpha(alpha.point(lambda p: int(p * 0.38)))
    return shade.filter(ImageFilter.GaussianBlur(16))


def paste(base: Image.Image, sprite: Image.Image, xy: tuple[int, int]) -> None:
    base.alpha_composite(sprite, xy)


def share_image(fredoka: Path, nunito: Path) -> Image.Image:
    image = blobs(gradient(SHARE))
    title_face = font(fredoka, 92, "Bold")
    tag_face = font(nunito, 36, "ExtraBold")
    word_a = "Squishee"
    word_b = "Academy"
    gap = 18
    aw, ah = text_size(title_face, word_a)
    bw, bh = text_size(title_face, word_b)
    tag = "Free learning games for K-3"
    tw, th = text_size(tag_face, tag)
    title_w = aw + gap + bw
    card_w = max(title_w, tw) + 128
    card_y = 36
    title_y = card_y + 28
    tag_y = title_y + max(ah, bh) + 18
    card_h = tag_y + th + 32 - card_y
    card_x = (SHARE[0] - card_w) // 2
    card = Image.new("RGBA", SHARE, (0, 0, 0, 0))
    shadow = Image.new("RGBA", SHARE, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (card_x, card_y + 10, card_x + card_w, card_y + card_h + 10),
        radius=48,
        fill=(90, 20, 70, 70),
    )
    image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(12)))
    ImageDraw.Draw(card).rounded_rectangle(
        (card_x, card_y, card_x + card_w, card_y + card_h),
        radius=48,
        fill=CREAM + (255,),
    )
    image.alpha_composite(card)

    title_x = (SHARE[0] - title_w) // 2
    draw_text(image, word_a, (title_x, title_y), title_face, PINK)
    draw_text(image, word_b, (title_x + aw + gap, title_y), title_face, TEAL)
    tag_x = (SHARE[0] - tw) // 2
    draw_text(image, tag, (tag_x, tag_y), tag_face, MUTED)

    names = ["strawberry", "frog", "peach"]
    overlap = 36
    # Faces tuck just under the card. Feet stay fully inside the frame.
    bottom_margin = 28
    max_height = SHARE[1] - bottom_margin - (card_y + card_h - 18)
    row = fit_row(names, 1040, max_height, overlap)
    total = sum(im.width for im in row) - overlap * (len(row) - 1)
    x = (SHARE[0] - total) // 2
    base_y = SHARE[1] - bottom_margin - row[0].height
    lifts = [8, 0, 10]
    for im, lift in zip(row, lifts):
        y = base_y - lift
        paste(image, shadow_for(im), (x, y + 16))
        paste(image, im, (x, y))
        x += im.width - overlap
    return image.convert("RGB")


def icon_background(size: int, rounded: bool) -> Image.Image:
    bg = gradient((size, size)).convert("RGBA")
    if not rounded:
        return bg
    mask = Image.new("L", (size, size), 0)
    radius = int(size * 0.24)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(bg, mask=mask)
    return out


def place_portrait(canvas: Image.Image, name: str, scale: float) -> Image.Image:
    portrait = trim(Image.open(PORTRAITS / f"{name}.png"))
    side = int(canvas.width * scale)
    portrait.thumbnail((side, side), Image.Resampling.LANCZOS)
    x = (canvas.width - portrait.width) // 2
    y = (canvas.height - portrait.height) // 2 + int(canvas.height * 0.02)
    canvas.alpha_composite(portrait, (x, y))
    return canvas


def save_icons() -> None:
    icons = OUT / "icons"
    icons.mkdir(parents=True, exist_ok=True)
    master = place_portrait(icon_background(512, rounded=True), "frog", 0.78)
    master.save(icons / "icon-512.png", optimize=True)
    master.resize((192, 192), Image.Resampling.LANCZOS).save(icons / "icon-192.png", optimize=True)
    maskable = place_portrait(icon_background(512, rounded=False), "frog", 0.62)
    maskable.save(icons / "icon-512-maskable.png", optimize=True)
    touch = place_portrait(icon_background(180, rounded=False), "frog", 0.74)
    touch.save(OUT / "apple-touch-icon.png", optimize=True)
    png32 = master.resize((32, 32), Image.Resampling.LANCZOS)
    png16 = master.resize((16, 16), Image.Resampling.LANCZOS)
    png48 = master.resize((48, 48), Image.Resampling.LANCZOS)
    png32.save(OUT / "favicon-32.png", optimize=True)
    png16.save(OUT / "favicon-16.png", optimize=True)
    png48.save(OUT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])


def main() -> None:
    fredoka, nunito = ensure_fonts()
    (OUT / "og").mkdir(parents=True, exist_ok=True)
    image = share_image(fredoka, nunito)
    dest = OUT / "og" / "squishee-academy.png"
    image.save(dest, format="PNG", optimize=True, compress_level=9)
    if dest.stat().st_size > 300 * 1024:
        for colors in (256, 224, 192, 160):
            quant = image.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
            quant.save(dest, format="PNG", optimize=True)
            if dest.stat().st_size <= 300 * 1024:
                break
    save_icons()
    print(f"wrote {dest} {dest.stat().st_size} bytes {image.size}")


if __name__ == "__main__":
    main()
