"""Rebuild the Academy Chinese subset so every UI and landing glyph is real.

Keeps the current subset's characters, then adds every CJK character used under
src/academy (storybooks excluded; another change owns those strings).
"""

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.subset import Options, Subsetter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "academy/public/fonts/NotoSansSC-subset.woff2"
SRC = Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc")
SCAN = ROOT / "src/academy"


def cmap_chars(font: TTFont) -> set[str]:
    chars: set[str] = set()
    for table in font["cmap"].tables:
        chars.update(chr(code) for code in table.cmap)
    return chars


def cjk_in_tree() -> set[str]:
    found: set[str] = set()
    for path in SCAN.rglob("*"):
        if not path.is_file():
            continue
        if "stories" in path.parts or "voice" in path.parts:
            continue
        if path.suffix not in {".ts", ".tsx", ".css", ".html", ".md", ".json"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        found.update(ch for ch in text if "\u4e00" <= ch <= "\u9fff")
    return found


def rename(font: TTFont) -> None:
    name = font["name"]
    for rec in name.names:
        if rec.nameID in {1, 3, 4, 6, 16}:
            value = {
                1: "Noto Sans SC",
                3: "Noto Sans SC Regular",
                4: "Noto Sans SC Regular",
                6: "NotoSansSC-Regular",
                16: "Noto Sans SC",
            }[rec.nameID]
            rec.string = value


def main() -> None:
    keep = cmap_chars(TTFont(OUT))
    needed = cjk_in_tree()
    text = "".join(sorted(keep | needed))
    font = TTFont(SRC, fontNumber=2)
    options = Options()
    options.layout_features = []
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.recommended_glyphs = False
    options.glyph_names = False
    options.hinting = False
    subsetter = Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    rename(font)
    font.flavor = "woff2"
    font.save(OUT)
    saved = TTFont(OUT)
    have = cmap_chars(saved)
    missing = sorted(ch for ch in needed if ch not in have)
    family = {rec.nameID: str(rec) for rec in saved["name"].names if rec.nameID in {1, 16}}
    print(f"glyphs {len(saved.getGlyphOrder())} cmap {len(have)} missing {''.join(missing)} family {family}")
    if missing:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
