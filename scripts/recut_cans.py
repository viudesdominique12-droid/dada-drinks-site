"""Redécoupe les canettes Dada à partir des visuels officiels « canette devant son pack ».

Sur ces visuels (dadadrinks.com, 1080 px, fond blanc), le bord droit de la
canette se détache toujours sur le blanc, alors que le bord gauche chevauche
souvent le pack. Une canette est symétrique : on mesure le bord droit ligne par
ligne (couverture fractionnaire comprise), on trouve l'axe sur les lignes où
les deux bords sont nets, et on reconstruit le bord gauche en miroir.
Résultat : une silhouette exacte, sans encoche ni morceau de pack, lissée des
deux côtés, avec des couleurs de bord débarrassées du blanc.

Usage : python3 scripts/recut_cans.py DOSSIER_SOURCES DOSSIER_SORTIE
"""
import os
import sys

import numpy as np
from PIL import Image

SOURCES = {
    'cola': 'pack-cola.png', 'cola-zero': 'pack-cola-zero.png', 'cola-cherry': 'can-cola-cherry.png',
    'cerise': 'pack-cerise.png', 'fraise': 'pack-fraise.png', 'litchi': 'pack-litchi.png',
    'lemon': 'pack-lemon.png', 'mangue': 'pack-mangue.png', 'melon': 'pack-melon.png',
    'mojito': 'pack-mojito.png', 'peche': 'pack-peche.png', 'pomme': 'pack-pomme.png',
    'icetea': 'pack-icetea.png',
}
SOLID = 40        # écart au blanc au-delà duquel un pixel est « objet »
TARGET_H = 780    # hauteur commune des canettes en sortie


def recut(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    H, W, _ = a.shape
    dev = (255.0 - a).max(axis=2)
    solid = dev > SOLID

    # la canette est l'objet le plus haut : ses colonnes sont pleines sur presque toute sa hauteur
    counts = solid.sum(axis=0)
    cols = np.flatnonzero(counts > 0.75 * counts.max())
    cx0, cx1 = cols.min(), cols.max()
    mid = slice(cx0 + (cx1 - cx0) // 3, cx1 - (cx1 - cx0) // 3)
    rows = np.flatnonzero(solid[:, mid].any(axis=1))
    top, bot = rows.min(), rows.max()

    def frac(y, inside, outside):
        ref = max(dev[y, inside], 1.0)
        return float(np.clip(dev[y, outside] / ref, 0, 1))

    # bord droit (rien à droite de la canette) avec couverture fractionnaire
    xR = np.zeros(H)
    lo, hi = max(0, cx0 - 12), min(W - 1, cx1 + 16)
    for y in range(top, bot + 1):
        xs = np.flatnonzero(solid[y, lo:hi + 1])
        if len(xs):
            i = lo + xs[-1]
            xR[y] = i + 1 + (frac(y, max(0, i - 3), i + 1) if i + 1 < W else 0)

    # axe : lignes où le pixel juste à gauche de la canette est blanc (bord gauche net)
    axes = []
    for y in range(top + int(0.04 * (bot - top)), bot - int(0.04 * (bot - top))):
        probe = max(0, cx0 - 10)
        if dev[y, probe] > 12 or xR[y] <= 0:
            continue
        xs = np.flatnonzero(solid[y, probe:cx0 + 30])
        if not len(xs):
            continue
        j = probe + xs[0]
        xl = j - (frac(y, min(W - 1, j + 3), j - 1) if j > 0 else 0)
        axes.append((xl + xR[y]) / 2)
    axis = float(np.median(axes))

    # silhouette en miroir + couverture fractionnaire des deux côtés
    alpha = np.zeros((H, W), np.float32)
    xs = np.arange(W, dtype=np.float32)
    for y in range(top, bot + 1):
        if xR[y] <= 0:
            continue
        xL = 2 * axis - xR[y]
        alpha[y] = np.clip(np.minimum(xs + 1, xR[y]) - np.maximum(xs, xL), 0, 1)
    # bords haut et bas : quelques lignes lissées d'après l'écart au blanc, dans la silhouette
    for y, ref in [(top - 1, top), (top - 2, top), (bot + 1, bot)]:
        if 0 <= y < H:
            alpha[y] = np.where(alpha[ref] > 0, np.clip(dev[y] / 120.0, 0, 1), 0)

    # décontamination : on retire la part de blanc des pixels de bord
    al = alpha[..., None]
    rgb = np.where(al > 0, (a - (1 - al) * 255.0) / np.maximum(al, 1e-3), 0)
    rgba = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    bbox = im.getchannel('A').point(lambda v: 255 if v > 0 else 0).getbbox()
    im = im.crop((bbox[0] - 2, bbox[1] - 2, bbox[2] + 2, bbox[3] + 2))
    k = TARGET_H / im.height
    return im.resize((round(im.width * k), TARGET_H), Image.LANCZOS), axis, len(axes)


if __name__ == '__main__':
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    for name, f in SOURCES.items():
        im, axis, n = recut(os.path.join(src_dir, f))
        out = os.path.join(out_dir, name + '.png')
        im.save(out, optimize=True)
        print(f'{name:12s} {im.size}  axe={axis:.1f} ({n} lignes)  {os.path.getsize(out) // 1024} Ko')
