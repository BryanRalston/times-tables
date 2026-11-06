"""Key Imagine story/counting masters using the established edge-flood keyer.
Usage: python3 scripts/key-story-props.py /path/to/masters
Masters: story/<id>.jpg and problem/<id>.jpg. Outputs 512px transparent PNGs.
"""
from pathlib import Path
import importlib.util
import sys
from PIL import Image, ImageFilter
from imagequant import quantize_pil_image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("key_squishees", ROOT / "scripts/key-squishees.py")
keyer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(keyer)

def is_prop_key(r, g, b):
    # Imagine sometimes renders the requested #FF00FF as a deeper pink.
    # Blue:red ratio separates that plate from the story's red hat/kite/apple.
    return r > 120 and b > 55 and g < 100 and r - g > 65 and b - g > 35 and b > r * .32

keyer.is_chroma_bg = is_prop_key
keyer.is_strict_fringe = is_prop_key

def main(masters):
    for kind, folder in (("story", "story-props"), ("problem", "problem-objects")):
        dest = ROOT / "public/art" / folder
        dest.mkdir(parents=True, exist_ok=True)
        for source in sorted((masters / kind).glob("*.jpg")):
            im = keyer.key_image(Image.open(source), strict=True)
            # One source-pixel choke removes JPEG mixed-color fringe before resampling.
            alpha = im.getchannel("A").filter(ImageFilter.MinFilter(3))
            im.putalpha(alpha)
            bbox = alpha.getbbox()
            if not bbox:
                raise ValueError(f"Empty object: {source}")
            if kind == "story" and source.stem == "snack":
                # Koala's book says yellow snack; preserve the existing apple meaning.
                # Only shift red skin, keeping brown stem and green leaf unchanged.
                hsv = np.array(im.convert("RGB").convert("HSV"))
                skin = ((hsv[:, :, 0] < 12) | (hsv[:, :, 0] > 240)) & (hsv[:, :, 1] > 120) & (np.array(alpha) > 0)
                hsv[skin, 0] = 34
                hsv[skin, 1] = (hsv[skin, 1] * .85).astype("uint8")
                im = Image.fromarray(hsv, "HSV").convert("RGBA")
                im.putalpha(alpha)
            crop = im.crop(bbox)
            crop.thumbnail((420, 420), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (512, 512))
            canvas.alpha_composite(crop, ((512-crop.width)//2, (512-crop.height)//2))
            # Palette compression keeps each PNG comfortably below 120KB.
            canvas = quantize_pil_image(canvas, dithering_level=1, max_colors=256, min_quality=85, max_quality=100)
            output = dest / (source.stem + ".png")
            canvas.save(output, optimize=True)
            print(f"{output.relative_to(ROOT)} {output.stat().st_size} bytes")

if __name__ == "__main__":
    main(Path(sys.argv[1]))
