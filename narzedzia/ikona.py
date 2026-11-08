# Rysuje ikony PNG z tego samego kształtu co assets/ikona/favicon.svg (Pillow, bez konwertera SVG).
# Uruchomienie: python3 narzedzia/ikona.py
from pathlib import Path
from PIL import Image, ImageDraw

BLUE = (26, 92, 245, 255)
WHITE = (255, 255, 255, 255)
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'ikona'

# (koło głowy: cx, cy, r), (tułów: x, y, szer., wys., promień) — w układzie 64 × 64; środkowa postać rysowana na końcu
FIGURES = [
    ((16, 27, 6.5), (6.5, 36, 19, 34, 9.5)),
    ((48.5, 33, 5.5), (40.5, 40.5, 16, 30, 8)),
    ((32, 20, 7), (21.5, 30, 21, 40, 10.5)),
]
STROKE = 1.25  # połowa obrysu w kolorze tła, który oddziela postacie


def draw(size, rounded=True):
    k = size * 4 / 64  # rysujemy 4 × większe i zmniejszamy — gładkie krawędzie
    big = size * 4
    img = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, big - 1, big - 1), radius=14 * k if rounded else 0, fill=BLUE)
    figures = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    f = ImageDraw.Draw(figures)
    for (cx, cy, r), (x, y, w, h, rr) in FIGURES:
        for grow, color in ((STROKE, BLUE), (0, WHITE)):
            f.ellipse(((cx - r - grow) * k, (cy - r - grow) * k, (cx + r + grow) * k, (cy + r + grow) * k), fill=color)
            f.rounded_rectangle(((x - grow) * k, (y - grow) * k, (x + w + grow) * k, (y + h + grow) * k), radius=(rr + grow) * k, fill=color)
    mask = Image.new('L', (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=14 * k if rounded else 0, fill=255)
    img.paste(figures, (0, 0), Image.composite(figures, Image.new('RGBA', (big, big)), mask).getchannel('A'))
    return img.resize((size, size), Image.LANCZOS)


draw(32).save(OUT / 'favicon-32.png')
# iOS sam zaokrągla rogi ikony na ekranie głównym, więc tu pełny kwadrat
draw(180, rounded=False).save(OUT / 'apple-touch-icon.png')
print('gotowe:', OUT)
