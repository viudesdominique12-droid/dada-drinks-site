# DADA — Site animé (concept)

Site vitrine animé pour **Dada Drinks**, construit selon le « modèle » de la vidéo
*Claude DESIGN + Claude CODE : créer un site animé de A à Z* (Tony Lotis) :
**design system → sections animées → produit 3D interactif → animation au scroll (split reveal)**.

## ▶️ Lancer le site

Site 100 % statique (HTML/CSS/JS), aucun build nécessaire.

```bash
# depuis ce dossier
python3 -m http.server 5512
# puis ouvrir http://localhost:5512
```

(ou ouvrir directement `index.html` dans un navigateur)

## 🗂 Structure

Site **multi-pages** (comme le site officiel), nav + footer + thème partagés :

```
index.html            → Accueil (hero adaptatif, gamme, manifeste, culture, teaser histoire photo)
histoire.html         → L'histoire (story éditoriale 5 chapitres + tuyau de jus + mot « légende » qui se remplit)
particuliers.html     → Boutique : toute la gamme (13 parfums) + où acheter
professionnels.html   → Espace pro (B2B) : avantages, packs 24×33, frigos/PLV, formulaire
collaborations.html   → Dada × la culture (cartes photo) + vidéo TikTok verticale
contact.html          → Contact : formulaire + coordonnées
css/style.css         → design system + styles (THÈME CLAIR) partagés
js/main.js            → logique partagée (GSAP + ScrollTrigger + Lenis), robuste par page
assets/brand/         → logo officiel Dada
assets/cans/clean/    → 13 canettes détourées (fond transparent)
assets/photos/        → photos street/lifestyle + frigos
assets/video/         → vidéo TikTok (mp4 + poster)
scripts/              → scripts Python (détourage canettes, traitement images)
Photos/  Vidéos/      → où l'utilisateur dépose les nouveaux médias bruts
```

> **Cache-busting** : les refs `css/style.css?vN` et `js/main.js?vN` portent un numéro de version (actuel : **v45**) — l'incrémenter à chaque modif CSS/JS.

## 🎨 Design system (extrait de la marque)

| Élément | Valeur |
|---|---|
| Noir profond | `#0A0103` |
| Rouge DADA | `#E2001A` |
| Vert (fraîcheur) | `#00E785` |
| Magenta | `#E3023B` |
| Titres | **Rubik** (900) |
| Texte | **Montserrat** |

Couleurs et typographies relevées directement sur le site officiel + ADN visuel
capté sur l'Instagram @dadadrinks (rouge signature, photographie street, ton « bouscule les codes »).

## ✨ Animations clés

- **Thème clair partout** (fond crème, texte foncé). Accents en **rouge uni** (pas de dégradé multicolore — choix de la marque).
- **Intro « split »** (accueil) : le mot DADA se déchire en deux et révèle le hero.
- **Hero adaptatif** : canette interactive (tilt souris) + **sélecteur de parfum** qui **teinte le fond** au parfum choisi.
- **Gamme** : scroll horizontal pinné des 13 parfums (cartes pleine couleur).
- **Expérience** : canette qui pivote au scroll + textes enchaînés.
- **Collaborations** : cartes en vraies photos + **vidéo TikTok verticale** (autoplay muet + bouton son).
- **Histoire** : story éditoriale (image/texte alterné, vraies photos) + **tuyau de jus central courbé** qui se remplit au scroll (avec bulles) + le mot **« la légende »** = récipient SVG qui **se remplit de jus** (surface ondulée + bulles).
- Transverse : Lenis (smooth scroll), curseur custom, boutons magnétiques, burger mobile, `prefers-reduced-motion` géré, responsive.

## 🖼 Visuels & médias

Canettes, logo, photos = **assets officiels Dada** (détourés / optimisés) — propriété de la marque, à valider pour une mise en ligne réelle.
Pour ajouter un média : **le déposer dans `Photos/` ou `Vidéos/`**, puis il est traité (PIL / ffmpeg) et intégré.

## ⚠️ Statut

Concept de démonstration. Liens panier / points de vente / newsletter / formulaires décoratifs (à brancher à un back-office réel). Pas encore mis en ligne.
