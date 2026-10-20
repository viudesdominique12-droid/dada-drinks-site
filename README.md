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
index.html            → Accueil (intro zoom, hero cinéma, gamme, expérience, culture, bande photo)
histoire.html         → L'histoire (story éditoriale 5 chapitres + tube de verre rempli de jus + « la légende »)
particuliers.html     → Boutique : toute la gamme (13 parfums) + où acheter
professionnels.html   → Espace pro (B2B) : salon SIAL, avantages, packs 24×33, frigos/PLV, formulaire
collaborations.html   → Dada × la culture (cartes photo) + vidéo TikTok + reel Instagram
contact.html          → Contact : profils (contact.html#pro, #presse…), formulaire, FAQ, partenaires
mentions-legales.html → Mentions légales (éditeur à compléter), données, cookies, crédits
css/style.css         → design system + styles (THÈME CLAIR) partagés
js/main.js            → logique partagée (GSAP + ScrollTrigger + Lenis), robuste par page
js/fx.js              → moteurs visuels : mots remplis de jus, bulles, tube de verre, badge SIAL
assets/brand/         → logo officiel Dada
assets/cans/clean/    → 13 canettes redécoupées depuis les visuels officiels (scripts/recut_cans.py)
assets/histoire/      → archives (premier logo, premières canettes 2007, canette slim 2018…)
assets/pros/ assets/collabs/ → vitrines, palette, Quai 54, Paris Basket, JCDecaux
assets/fx/            → textures d'effets (gouttelettes de buée)
assets/insta/         → photos et reel issus de l'Instagram @dadadrinks
assets/photos/        → photos street/lifestyle + frigos
assets/video/         → vidéos TikTok / salon (mp4 + poster)
scripts/              → scripts Python (détourage canettes, traitement images)
Photos/  Vidéos/      → où l'utilisateur dépose les nouveaux médias bruts
```

> **Cache-busting** : les refs `css/style.css?v=N`, `js/main.js?v=N` et `js/fx.js?v=N` portent un numéro de version (actuel : **v68**) — l'incrémenter à chaque modif CSS/JS.

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
- **Hero cinéma** (accueil) : photo nette à droite fondue dans une ambiance floutée, titre avec le mot **« bouscule » rempli de jus** ; les **enseignes** défilent en continu plus bas.
- **Gamme** : scroll horizontal pinné des 13 parfums (cartes pleine couleur).
- **Expérience** : canette qui pivote au scroll + textes enchaînés.
- **Collaborations** : cartes en vraies photos + **vidéo TikTok verticale** (autoplay muet + bouton son).
- **Histoire** : story éditoriale (image/texte alterné, vraies photos) + **tuyau de jus central courbé** qui se remplit au scroll (avec bulles) + le mot **« la légende »** = récipient SVG qui **se remplit de jus** (surface ondulée + bulles).
- Transverse : Lenis (smooth scroll), curseur custom, boutons magnétiques, burger mobile, `prefers-reduced-motion` géré, responsive.
- **Polish v56** : transitions de page (wipe rouge « DADA »), barre de scroll « jus », fizz de bulles à l'ajout panier, **DADA géant du footer qui se remplit de jus**, parallax + reflet sur la photo du hero, favicon + meta Open Graph (partage), bandeau passé en dégradé famille rouge.
- **v58** : hero cinéma plein écran, cartes culture en photos, CTA rouge, mur de logos distributeurs, curseur pétillant.
- **v59–v62** : un seul moteur de **liquide** pour tous les mots remplis de jus (vague, caustiques, bulles qui éclatent, ballottement au scroll) ; **bulles** réalistes ; l'histoire passe à un **tube de verre** qui serpente entre photos et textes ; **canettes** réparées avec reflet, balayage lumineux au survol et **buée** ; photos récentes de l'Instagram Dada ; section **salon SIAL** dont le badge change seul selon la date.

## 🖼 Visuels & médias

Canettes, logo, photos = **assets officiels Dada** (détourés / optimisés), issus de dadadrinks.com, de l'Instagram @dadadrinks et de la page Facebook DADA Drinks — propriété de la marque, à valider pour une mise en ligne réelle. Prix, composition, histoire et contacts sont alignés sur le site officiel (relevé du 20/10/2026).
Pour ajouter un média : **le déposer dans `Photos/` ou `Vidéos/`**, puis il est traité (PIL / ffmpeg) et intégré.

## ⚠️ Statut

Concept de démonstration. Liens panier / points de vente / newsletter / formulaires décoratifs (à brancher à un back-office réel).
En ligne (GitHub Pages) : https://viudesdominique12-droid.github.io/dada-drinks-site/
