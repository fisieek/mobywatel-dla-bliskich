# Tekstury postaci Rocketbox dla prototypu: 2048 px TGA → 1024 px WebP (~150 KB zamiast 12 MB),
# plus drobne zmiany wyglądu, bez Blendera:
#   krystyna — siwe włosy (pasma i włosy namalowane na teksturze głowy, z pominięciem twarzy),
#   zosia    — bluzka i buty zamiast amarantowych w kolorze morskim.
#
# Wymaga Pillow. Uruchomienie:
#   python3 narzedzia/postacie/tekstury.py <folder z TGA> assets/postacie/<postać> <postać>
# Źródło: github.com/microsoft/Microsoft-Rocketbox, Assets/Avatars/<…>/Textures (licencja MIT).
import colorsys
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024
PREFIX = {'krystyna': 'f015', 'anna': 'f017', 'zosia': 'cf001'}


def grey(rgb, mask=None):
    """Blond i brąz → siwe: jaśniej i lekko chłodno."""
    lum = rgb.convert('L').point(lambda v: min(255, int(v * 0.75 + 85)))
    out = Image.merge('RGB', (lum.point(lambda v: max(0, v - 4)), lum, lum.point(lambda v: min(255, v + 6))))
    return out if mask is None else Image.composite(out, rgb, mask)


def hair_mask(rgb):
    """Włosy mają czerwień ~1–1,55 × żółci (R−G wobec G−B), skóra ~1,8–2,5 ×. Twarz, szyja i oczy zostają."""
    w, h = rgb.size
    src = rgb.load()
    mask = Image.new('L', (w, h), 0)
    px = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b = src[x, y]
            rg, gb = r - g, g - b
            if r > 25 and gb > 3 and rg < 48:
                px[x, y] = int(max(0.0, min(1.0, (1.75 - rg / gb) / 0.3)) * 255)
    d = ImageDraw.Draw(mask)
    d.ellipse((0.33 * w, 0.15 * h, 0.67 * w, 0.50 * h), fill=0)  # twarz
    d.rectangle((0, 0.50 * h, w, 0.66 * h), fill=0)  # szyja i ramiona
    d.rectangle((0, 0.58 * h, 0.14 * w, h), fill=0)  # wnętrze ust
    d.rectangle((0.18 * w, 0.84 * h, 0.32 * w, h), fill=0)  # oko
    return mask.filter(ImageFilter.GaussianBlur(3))


def recolor_magenta(rgb, hue=0.53, sat_scale=0.75):
    """Amarantowy (odcień 270–330°) → morski, z zachowaniem cieni i faktury."""
    out = rgb.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.75 <= hh <= 0.92 and s > 0.3:
                nr, ng, nb = colorsys.hsv_to_rgb(hue, s * sat_scale, v * 0.92)
                px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255))
    return out


def load(path, mode='RGB'):
    return Image.open(path).convert(mode).resize((SIZE, SIZE), Image.LANCZOS)


def main(src, out, who):
    src, out = Path(src), Path(out)
    out.mkdir(parents=True, exist_ok=True)
    p = PREFIX[who]

    head = load(src / f'{p}_head_color.tga')
    body = load(src / f'{p}_body_color.tga')
    if who == 'krystyna':
        head = grey(head, hair_mask(head))
    if who == 'zosia':
        body = recolor_magenta(body)
    head.save(out / 'glowa.webp', quality=82)
    body.save(out / 'cialo.webp', quality=82)
    load(src / f'{p}_head_normal.tga').save(out / 'glowa_normal.webp', quality=88)

    hair_file = src / f'{p}_opacity_color.tga'
    if hair_file.exists():
        hair = load(hair_file, 'RGBA')
        rgb = hair.convert('RGB')
        if who == 'krystyna':
            rgb = grey(rgb)
        rgb.putalpha(hair.getchannel('A'))
        rgb.save(out / 'wlosy.webp', quality=85)

    glasses = src / f'{p}_glasses_opacity_color.tga'
    if glasses.exists():
        Image.open(glasses).convert('RGBA').save(out / 'okulary.webp', quality=90)
    print('gotowe:', out)


if __name__ == '__main__':
    main(*sys.argv[1:4])
