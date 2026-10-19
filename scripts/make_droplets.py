"""Texture de condensation raccordable (tileable) : gouttelettes + micro-buée.

Rendu à 4x puis réduit (anti-aliasing). Chaque goutte : ombre en bas à droite,
corps clair translucide, reflet net en haut à gauche, petite caustique en bas.
"""
import random
import sys
from PIL import Image, ImageDraw, ImageFilter

T = 256          # taille finale de la tuile
K = 4            # suréchantillonnage
S = T * K
random.seed(7)

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img, "RGBA")


def wrap_positions(x, y, r):
    """Positions à dessiner pour que la tuile se raccorde sans couture."""
    out = [(x, y)]
    for dx in (-S, 0, S):
        for dy in (-S, 0, S):
            if dx == 0 and dy == 0:
                continue
            nx, ny = x + dx, y + dy
            if -r * 2 < nx < S + r * 2 and -r * 2 < ny < S + r * 2:
                out.append((nx, ny))
    return out


def ell(cx, cy, rx, ry, fill):
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=fill)


# micro-buée (très fins points)
for _ in range(900):
    r = random.uniform(0.35, 1.05) * K
    x, y = random.uniform(0, S), random.uniform(0, S)
    for px, py in wrap_positions(x, y, r):
        ell(px, py, r, r, (255, 255, 255, random.randint(40, 95)))

# gouttelettes (sans chevauchement grossier)
drops = []
tries = 0
while len(drops) < 95 and tries < 6000:
    tries += 1
    r = random.choice([random.uniform(1.0, 2.2), random.uniform(1.6, 3.4), random.uniform(2.6, 5.2)]) * K
    x, y = random.uniform(0, S), random.uniform(0, S)
    ok = True
    for (ox, oy, orr) in drops:
        dx = min(abs(x - ox), S - abs(x - ox))
        dy = min(abs(y - oy), S - abs(y - oy))
        if (dx * dx + dy * dy) ** 0.5 < (r + orr) * 1.25:
            ok = False
            break
    if ok:
        drops.append((x, y, r))

for (x, y, r) in drops:
    ry = r * random.uniform(1.04, 1.22)      # légèrement allongées (gravité)
    for px, py in wrap_positions(x, y, r):
        # ombre portée bas-droite
        ell(px + r * 0.16, py + r * 0.22, r * 1.02, ry * 1.02, (20, 0, 4, 70))
        # corps translucide
        ell(px - r * 0.04, py - r * 0.05, r * 0.94, ry * 0.94, (255, 255, 255, 38))
        # dégradé intérieur (centre plus clair)
        ell(px - r * 0.12, py - r * 0.14, r * 0.62, ry * 0.6, (255, 255, 255, 30))
        # caustique (lumière réfractée en bas)
        d.arc([px - r * 0.62, py - ry * 0.2, px + r * 0.5, py + ry * 0.78], start=35, end=150,
              fill=(255, 255, 255, 120), width=max(1, int(r * 0.16)))
        # reflet spéculaire net haut-gauche
        ell(px - r * 0.36, py - ry * 0.42, r * 0.26, r * 0.2, (255, 255, 255, 235))

img = img.filter(ImageFilter.GaussianBlur(K * 0.35))
img = img.resize((T, T), Image.LANCZOS)
out = sys.argv[1]
img.save(out, optimize=True)
print("droplets", img.size, len(drops), "gouttes ->", out)
