"""Reconstruit une silhouette propre pour chaque canette détourée.

Pour chaque ligne : bords gauche/droit « solides » (alpha > SOLID), lissés par
médiane glissante (supprime encoches et pointes). Entre les bords lissés :
opaque, les pixels manquants (encoches) sont recolorés depuis le pixel opaque
le plus proche sur la ligne. Hors des bords : transparent (supprime les
débris). Bords anti-aliasés sur 1 px avec couverture fractionnaire.
Le haut (couvercle) et le bas (fond) gardent leur forme : on ne retouche que
les lignes où les deux bords existent.
"""
import sys
import numpy as np
from PIL import Image

SOLID = 200
WIN = 15          # fenêtre de la médiane (lignes)
TOL = 1.2         # écart (px) au-delà duquel un bord est corrigé


def median_filter_1d(a, win):
    half = win // 2
    pad = np.pad(a, half, mode="edge")
    out = np.empty_like(a, dtype=float)
    for i in range(len(a)):
        out[i] = np.median(pad[i:i + win])
    return out


def moving_avg(a, win):
    half = win // 2
    pad = np.pad(a, half, mode="edge")
    k = np.ones(win) / win
    return np.convolve(pad, k, mode="valid")


def fix(src, dst):
    im = Image.open(src).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    rgb, a = arr[..., :3], arr[..., 3]
    H, W = a.shape
    solid = a > SOLID
    rows = np.where(solid.any(axis=1))[0]
    L = np.full(H, np.nan)
    R = np.full(H, np.nan)
    for y in rows:
        xs = np.where(solid[y])[0]
        L[y], R[y] = xs[0], xs[-1] + 1          # R exclusif
    valid = ~np.isnan(L)
    ys = np.where(valid)[0]
    Lv, Rv = L[valid], R[valid]
    Lm = moving_avg(median_filter_1d(Lv, WIN), 5)
    Rm = moving_avg(median_filter_1d(Rv, WIN), 5)
    # on ne corrige que là où le bord s'écarte vraiment de la tendance
    Lf = np.where(np.abs(Lv - Lm) > TOL, Lm, Lv)
    Rf = np.where(np.abs(Rv - Rm) > TOL, Rm, Rv)

    out_rgb = rgb.copy()
    out_a = np.zeros_like(a)
    xs_all = np.arange(W, dtype=np.float32)
    for i, y in enumerate(ys):
        l, r = Lf[i], Rf[i]
        # couverture fractionnaire : pixel x couvre [x, x+1]
        cov = np.clip(np.minimum(xs_all + 1, r) - np.maximum(xs_all, l), 0, 1)
        row_a = cov * 255.0
        # garde le dégradé d'origine s'il est plus « plein » (bords AA du couvercle)
        inside = (xs_all >= np.floor(l)) & (xs_all < np.ceil(r))
        row_a = np.where(inside, np.maximum(row_a, np.minimum(a[y], 255) * (cov > 0)), 0)
        # comble les encoches : interpolation linéaire entre le pixel opaque à gauche
        # et à droite (respecte le dégradé d'ombrage du cylindre) ; si l'encoche
        # touche le bord, on prend le pixel opaque le plus proche dans la COLONNE
        holes = (row_a > 128) & (a[y] < SOLID)
        if holes.any():
            good = np.where(a[y] >= SOLID)[0]
            if len(good):
                for x in np.where(holes)[0]:
                    lft = good[good < x]
                    rgt = good[good > x]
                    if len(lft) and len(rgt):
                        xl, xr = lft[-1], rgt[0]
                        k = (x - xl) / max(1, xr - xl)
                        out_rgb[y, x] = rgb[y, xl] * (1 - k) + rgb[y, xr] * k
                    else:
                        col = a[:, x] >= SOLID
                        ys_ok = np.where(col)[0]
                        if len(ys_ok):
                            yy = ys_ok[np.argmin(np.abs(ys_ok - y))]
                            if abs(yy - y) < 80:
                                out_rgb[y, x] = rgb[yy, x]
                                continue
                        j = good[np.argmin(np.abs(good - x))]
                        out_rgb[y, x] = rgb[y, j]
        out_a[y] = row_a
    # lignes sans bord solide (tout en haut/bas) : on garde l'alpha d'origine atténué
    for y in range(H):
        if not valid[y]:
            out_a[y] = a[y]
    out = np.dstack([out_rgb, out_a]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst, optimize=True)
    changed = int((np.abs(out_a - a) > 40).sum())
    return W, H, changed


if __name__ == "__main__":
    src_dir, dst_dir = sys.argv[1], sys.argv[2]
    import glob, os
    for f in sorted(glob.glob(os.path.join(src_dir, "*.png"))):
        name = os.path.basename(f)
        W, H, changed = fix(f, os.path.join(dst_dir, name))
        print(f"{name:16s} {W}x{H}  pixels corrigés: {changed}")
