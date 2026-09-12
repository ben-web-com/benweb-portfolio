# BEN WEB — site commercial freelance

Site de **BEN WEB** (Benjamin Ikhmim) : 7 services, leurs réalisations, la
méthode et le contact. Objectif : convertir un visiteur en demande de projet.

## Stack

Site **100 % statique** : HTML, CSS et JavaScript vanilla. Aucune dépendance,
aucun framework, aucune étape de build obligatoire.

```
portfolio/
├── index.html              Accueil, le menu des 6 services
├── cartes-nfc.html         Service 01
├── cartes-restaurant.html  Service 02
├── marketing.html          Service 03
├── sites-internet.html     Service 04
├── applications.html       Service 05
├── ia-automatisation.html  Service 06
├── infos.html              Rapidité · délais · méthode · livrables · FAQ
├── cgv.html                Conditions générales de vente
├── contact.html            Canaux de contact + copie de l'e-mail
├── mentions-legales.html   Mentions légales
├── confidentialite.html    Politique de confidentialité
├── 404.html                Page d'erreur
├── netlify.toml            Déploiement, cache et en-têtes de sécurité
├── robots.txt · sitemap.xml
├── tools/                  Générateur des pages, maquettes et photos sources
│   ├── build.py · content.py   Contenu et gabarits des pages
│   ├── mockups/                Maquettes d'interface en HTML, rendues en images
│   └── photos/                 Photos CC0 sources + LICENCES.txt
└── assets/
    ├── css/style.css       Design system (tokens) + composants
    ├── css/fonts.css       @font-face locaux
    ├── fonts/              Inter Tight + Instrument Serif (woff2 latin)
    ├── js/main.js          Nav, menu déroulant, révélations, FAQ, copie, halo curseur, parallaxe
    ├── work/               Captures des réalisations (WebP, ~50 Ko chacune)
    ├── social/             Logos Gmail, WhatsApp, Instagram, TikTok
    ├── logo-mark.png       Monogramme BW (header + favicons)
    ├── logo-full.png       Logo complet détouré
    └── og.jpg              Image de partage réseaux sociaux
```

## Modifier le contenu

Les 11 pages partagent le même en-tête, le même pied de page et la même
navigation. Pour éviter de répéter onze fois la même modification, elles sont
générées depuis **`tools/content.py`** (tout le texte) et **`tools/build.py`**
(les gabarits) :

```bash
python3 tools/build.py
```

- Ajouter / modifier un **service** → `tools/content.py`, liste `SERVICES`
- Ajouter / modifier une **réalisation** → `tools/content.py`, dictionnaire `CASES`
- Modifier les **coordonnées, le domaine, les réseaux** → `tools/content.py`, dictionnaire `SITE`
- Modifier la **FAQ** → `tools/build.py`, liste `FAQ`
- Modifier les **pages légales** → `tools/build.py`, fonctions `build_legal()` et `build_cgv()`

Après chaque modification du CSS ou du JS, incrémenter `ASSET_V` dans
`tools/build.py` : ce numéro est ajouté aux URL des fichiers (`style.css?v=…`)
et force les navigateurs à recharger la nouvelle version au lieu de l'ancienne.

⚠️ Ne pas éditer les fichiers `.html` à la main : ils sont écrasés au prochain
`build.py`. Le CSS et le JS, eux, s'éditent directement.

## Lancer en local

```bash
python3 -m http.server 4180 --directory portfolio
```

Puis ouvrir http://localhost:4180

## Déployer sur Netlify

1. Glisser le dossier `portfolio/` sur https://app.netlify.com/drop.
2. Ajouter le domaine `ben-web.com` dans *Site settings → Domain management*.
3. Le site n'a pas de formulaire : les prospects écrivent par e-mail, WhatsApp,
   Instagram ou TikTok. Rien à configurer côté serveur.
4. Netlify sert automatiquement `404.html` sur les URL inconnues.

## Ajouter une réalisation

1. Capturer le site :
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1440,1000 --screenshot=capture.png "https://url-du-site"
   ```
2. Convertir en WebP (~50 Ko) et déposer dans `assets/work/`.
3. Ajouter une entrée dans `CASES` (`tools/content.py`), puis référencer sa clé
   dans le champ `cases` du ou des services concernés, et relancer `build.py`.

## Identité

- Logo : monogramme **BW** lime sur fond noir. Source haute résolution conservée
  hors du dossier de déploiement : `SITE CV/logo BEN WEB (source 2048px).png`.
- Vert principal `#CBFF4D` · vert sourd `#A8D63C` · noir `#08090A` ·
  blanc chaud `#F0EEE9` · gris texte `#9A9BA3`.
- Typographie : **Inter Tight** (titres et texte) + **Instrument Serif italique**
  (mots mis en valeur).

## Design

- Fond sombre chaud, accent lime unique, grain analogique léger sur toute la page.
- Halo lumineux qui suit le curseur sur les cartes, parallaxe douce sur les
  captures, apparitions au scroll avec flou, fondu entre les pages.
- Toutes ces animations sont désactivées si le visiteur a activé « réduire les
  animations » dans son système.

## Cadre commercial

Prestations réservées aux **professionnels** : pas de droit de rétractation, pas
de médiateur de la consommation à souscrire. Les CGV fixent le paiement intégral
à la commande, 3 séries de retours incluses, la validation tacite après 7 jours
sans réponse, une garantie de 30 jours et les sommes conservées en cas
d'annulation par le client.

## Maquettes de démonstration

Les visuels des services sont des maquettes HTML rendues en image :

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --window-size=1440,1000 --screenshot=sortie.png "http://localhost:4180/tools/mockups/site-resto.html"
```

Puis conversion en WebP dans `assets/work/`. Les photos utilisées sont sous
licence CC0 (domaine public, aucune attribution requise), détails dans
`tools/photos/LICENCES.txt`. Le dossier `tools/` n'est pas nécessaire au
fonctionnement du site et peut être exclu du déploiement.

## Principes tenus

- Aucun faux témoignage, faux client, faux chiffre ou fausse statistique.
- Les projets personnels ou de démonstration sont signalés comme tels.
- Les limites réelles sont annoncées sur les pages concernées (cartes physiques
  commandées chez un imprimeur, PWA plutôt qu'application native, frais du
  prestataire de paiement).
- Le site reste lisible sans JavaScript et respecte `prefers-reduced-motion`.
