"""Prépare la photo du hero de l'accueil à partir d'un visuel Instagram.

1. Efface le logo DADA incrusté en haut à gauche : on recopie le rideau situé
   juste en dessous (plis verticaux → le motif reste continu), recalé en
   couleur sur le voisinage, fondu par un masque adouci.
2. Produit une petite version floutée et assombrie pour le fond d'ambiance
   (pré-calculée : pas de filtre CSS blur plein écran, coûteux au scroll).

Usage : python3 scripts/hero_photo.py SRC OUT_HERO OUT_AMBIANCE
"""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

src, out_hero, out_amb = sys.argv[1:4]
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.float32)

x0, y0, x1, y1 = 80, 82, 392, 228      # logo (+ ®), contour blanc compris, + marge de fondu
dy = 130                               # le patch vient d'en dessous
patch = a[y0 + dy:y1 + dy, x0:x1].copy()

# voisinage du logo (anneau autour du rectangle) pour caler la couleur
ring = np.zeros(a.shape[:2], bool)
ring[max(0, y0 - 40):y1 + 20, max(0, x0 - 40):x1 + 40] = True
ring[y0:y1, x0:x1] = False
ref = a[ring]
mu_r, sd_r = ref.mean(0), ref.std(0) + 1e-3
mu_p, sd_p = patch.reshape(-1, 3).mean(0), patch.reshape(-1, 3).std(0) + 1e-3
patch = (patch - mu_p) / sd_p * sd_r + mu_r

# masque adouci : plein au centre, fondu sur les bords
m = Image.new("L", (x1 - x0, y1 - y0), 0)
inner = Image.new("L", (x1 - x0 - 24, y1 - y0 - 24), 255)
m.paste(inner, (12, 12))
m = np.asarray(m.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)[..., None] / 255
a[y0:y1, x0:x1] = a[y0:y1, x0:x1] * (1 - m) + patch * m

hero = Image.fromarray(a.clip(0, 255).astype(np.uint8))
hero.save(out_hero, quality=88, optimize=True, progressive=True)

amb = hero.resize((hero.width // 4, hero.height // 4), Image.LANCZOS)
amb = amb.filter(ImageFilter.GaussianBlur(7))
amb = ImageEnhance.Color(amb).enhance(1.25)
amb = ImageEnhance.Brightness(amb).enhance(0.42)
amb.save(out_amb, quality=80, optimize=True)
print(hero.size, amb.size)
